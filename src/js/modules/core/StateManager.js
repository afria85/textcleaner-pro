/**
 * State Management System
 * Centralized state management with persistence and reactivity
 */

import Logger from '../utils/Logger.js';
import { debounce } from '../utils/Debounce.js';

class StateManager {
    constructor() {
        this.state = new Map();
        this.subscribers = new Map();
        this.middleware = [];
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        this.logger = new Logger('StateManager');
        this.persistence = null;
        this.isInitialized = false;
        
        // Auto-save configuration
        this.autoSave = {
            enabled: true,
            debounceTime: 1000,
            keys: new Set(),
        };
    }

    /**
     * Initialize state manager
     */
    async initialize(options = {}) {
        if (this.isInitialized) {
            this.logger.warn('StateManager already initialized');
            return;
        }

        try {
            this.logger.info('Initializing StateManager...');
            
            // Set configuration
            if (options.initialState) {
                this.setState('', options.initialState);
            }
            
            if (options.persistence) {
                this.persistence = options.persistenceService || await this.createPersistenceService();
                await this.loadPersistedState();
            }
            
            if (options.autoSave !== undefined) {
                this.autoSave.enabled = options.autoSave;
            }
            
            if (options.autoSaveKeys) {
                options.autoSaveKeys.forEach(key => this.autoSave.keys.add(key));
            }
            
            this.isInitialized = true;
            this.logger.info('StateManager initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize StateManager:', error);
            throw error;
        }
    }

    /**
     * Create persistence service
     */
    async createPersistenceService() {
        // Default to localStorage-based persistence
        return {
            save: (key, value) => {
                try {
                    localStorage.setItem(`state_${key}`, JSON.stringify(value));
                    return true;
                } catch (error) {
                    this.logger.warn('Failed to save to localStorage:', error);
                    return false;
                }
            },
            load: (key) => {
                try {
                    const value = localStorage.getItem(`state_${key}`);
                    return value ? JSON.parse(value) : null;
                } catch (error) {
                    this.logger.warn('Failed to load from localStorage:', error);
                    return null;
                }
            },
            remove: (key) => {
                localStorage.removeItem(`state_${key}`);
            },
            clear: () => {
                Object.keys(localStorage)
                    .filter(key => key.startsWith('state_'))
                    .forEach(key => localStorage.removeItem(key));
            },
        };
    }

    /**
     * Load persisted state
     */
    async loadPersistedState() {
        if (!this.persistence) return;
        
        try {
            const persisted = this.persistence.load('root');
            if (persisted) {
                this.setState('', persisted, { silent: true, skipHistory: true });
                this.logger.debug('Loaded persisted state');
            }
        } catch (error) {
            this.logger.warn('Failed to load persisted state:', error);
        }
    }

    /**
     * Save state to persistence
     */
    saveStateDebounced = debounce(() => {
        if (!this.persistence || !this.autoSave.enabled) return;
        
        try {
            const stateToSave = {};
            
            if (this.autoSave.keys.size > 0) {
                // Save only specified keys
                for (const key of this.autoSave.keys) {
                    const value = this.getState(key);
                    if (value !== undefined) {
                        stateToSave[key] = value;
                    }
                }
            } else {
                // Save entire state
                stateToSave.root = this.getState();
            }
            
            this.persistence.save('root', stateToSave);
            this.logger.debug('State auto-saved');
        } catch (error) {
            this.logger.warn('Failed to auto-save state:', error);
        }
    }, this.autoSave.debounceTime);

    /**
     * Set state value
     */
    setState(path, value, options = {}) {
        // Run middleware
        const middlewareResult = this.runMiddleware('beforeSet', { path, value, options });
        if (middlewareResult.cancel) {
            return false;
        }
        
        const processedValue = middlewareResult.value !== undefined ? middlewareResult.value : value;
        
        // Convert dot notation to array
        const keys = this.parsePath(path);
        const oldValue = this.getState(path);
        
        // Deep clone for comparison
        const newValue = this.cloneValue(processedValue);
        
        // Check if value actually changed
        if (this.isEqual(oldValue, newValue) && !options.force) {
            return false;
        }
        
        // Update state
        this.updateState(keys, newValue);
        
        // Record in history if not skipped
        if (!options.skipHistory) {
            this.recordHistory(path, oldValue, newValue);
        }
        
        // Notify subscribers
        if (!options.silent) {
            this.notifySubscribers(path, newValue, oldValue);
        }
        
        // Auto-save if enabled
        if (this.autoSave.enabled && this.persistence) {
            this.saveStateDebounced();
        }
        
        // Run after middleware
        this.runMiddleware('afterSet', { path, value: newValue, oldValue, options });
        
        this.logger.debug(`State updated: ${path}`, {
            oldValue,
            newValue,
            options,
        });
        
        return true;
    }

    /**
     * Update state at specific path
     */
    updateState(keys, value) {
        let current = this.state;
        
        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current.has(key)) {
                current.set(key, new Map());
            }
            current = current.get(key);
        }
        
        // Set the value
        const lastKey = keys[keys.length - 1];
        if (value === undefined) {
            current.delete(lastKey);
        } else {
            current.set(lastKey, value);
        }
    }

    /**
     * Get state value
     */
    getState(path = '') {
        if (path === '') {
            return this.getFullState();
        }
        
        const keys = this.parsePath(path);
        let current = this.state;
        
        for (const key of keys) {
            if (!current.has(key)) {
                return undefined;
            }
            current = current.get(key);
        }
        
        return this.cloneValue(current);
    }

    /**
     * Get full state as plain object
     */
    getFullState() {
        const convertMap = (map) => {
            const obj = {};
            for (const [key, value] of map) {
                if (value instanceof Map) {
                    obj[key] = convertMap(value);
                } else {
                    obj[key] = this.cloneValue(value);
                }
            }
            return obj;
        };
        
        return convertMap(this.state);
    }

    /**
     * Subscribe to state changes
     */
    subscribe(path, callback, options = {}) {
        const keys = this.parsePath(path);
        const subscriptionId = Symbol(`subscription-${path}`);
        
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Map());
        }
        
        const pathSubscribers = this.subscribers.get(path);
        pathSubscribers.set(subscriptionId, {
            callback,
            options: {
                immediate: options.immediate || false,
                deep: options.deep !== undefined ? options.deep : true,
                once: options.once || false,
            },
        });
        
        // Call immediately if requested
        if (options.immediate) {
            try {
                callback(this.getState(path), undefined, path);
            } catch (error) {
                this.logger.error(`Error in immediate subscription callback for ${path}:`, error);
            }
        }
        
        this.logger.debug(`Subscribed to state: ${path}`, { subscriptionId });
        
        // Return unsubscribe function
        return () => this.unsubscribe(path, subscriptionId);
    }

    /**
     * Unsubscribe from state changes
     */
    unsubscribe(path, subscriptionId) {
        if (!this.subscribers.has(path)) {
            return false;
        }
        
        const pathSubscribers = this.subscribers.get(path);
        const success = pathSubscribers.delete(subscriptionId);
        
        if (pathSubscribers.size === 0) {
            this.subscribers.delete(path);
        }
        
        if (success) {
            this.logger.debug(`Unsubscribed from state: ${path}`, { subscriptionId });
        }
        
        return success;
    }

    /**
     * Notify subscribers of state change
     */
    notifySubscribers(path, newValue, oldValue) {
        // Notify exact path subscribers
        if (this.subscribers.has(path)) {
            const subscribers = this.subscribers.get(path);
            const toRemove = [];
            
            for (const [id, { callback, options }] of subscribers) {
                try {
                    callback(newValue, oldValue, path);
                    
                    if (options.once) {
                        toRemove.push(id);
                    }
                } catch (error) {
                    this.logger.error(`Error in subscription callback for ${path}:`, error);
                }
            }
            
            // Remove once subscribers
            toRemove.forEach(id => subscribers.delete(id));
            
            if (subscribers.size === 0) {
                this.subscribers.delete(path);
            }
        }
        
        // Notify parent path subscribers (for deep subscriptions)
        const notifyParents = (currentPath) => {
            const parentPath = currentPath.split('.').slice(0, -1).join('.');
            if (!parentPath) return;
            
            if (this.subscribers.has(parentPath)) {
                const parentSubscribers = this.subscribers.get(parentPath);
                for (const [, { callback, options }] of parentSubscribers) {
                    if (options.deep) {
                        try {
                            callback(
                                this.getState(parentPath),
                                this.getState(parentPath), // Old value would need caching
                                parentPath
                            );
                        } catch (error) {
                            this.logger.error(`Error in parent subscription callback for ${parentPath}:`, error);
                        }
                    }
                }
            }
            
            notifyParents(parentPath);
        };
        
        notifyParents(path);
    }

    /**
     * Record state change in history
     */
    recordHistory(path, oldValue, newValue) {
        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        const historyEntry = {
            path,
            oldValue,
            newValue,
            timestamp: Date.now(),
            stack: new Error().stack, // For debugging
        };
        
        this.history.push(historyEntry);
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    /**
     * Undo last state change
     */
    undo() {
        if (this.historyIndex < 0) {
            return false;
        }
        
        const entry = this.history[this.historyIndex];
        this.setState(entry.path, entry.oldValue, { skipHistory: true });
        this.historyIndex--;
        
        this.logger.debug(`Undo: ${entry.path}`);
        return true;
    }

    /**
     * Redo last undone state change
     */
    redo() {
        if (this.historyIndex >= this.history.length - 1) {
            return false;
        }
        
        this.historyIndex++;
        const entry = this.history[this.historyIndex];
        this.setState(entry.path, entry.newValue, { skipHistory: true });
        
        this.logger.debug(`Redo: ${entry.path}`);
        return true;
    }

    /**
     * Get history
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        this.logger.debug('Cleared state history');
    }

    /**
     * Add middleware
     */
    use(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        
        this.middleware.push(middleware);
        this.logger.debug('Added state middleware');
        
        return () => this.removeMiddleware(middleware);
    }

    /**
     * Run middleware
     */
    runMiddleware(type, data) {
        let result = { ...data };
        
        for (const middleware of this.middleware) {
            try {
                const middlewareResult = middleware(type, result);
                if (middlewareResult && typeof middlewareResult === 'object') {
                    result = { ...result, ...middlewareResult };
                }
            } catch (error) {
                this.logger.error(`Error in state middleware for ${type}:`, error);
            }
        }
        
        return result;
    }

    /**
     * Remove middleware
     */
    removeMiddleware(middleware) {
        const index = this.middleware.indexOf(middleware);
        if (index !== -1) {
            this.middleware.splice(index, 1);
            this.logger.debug('Removed state middleware');
            return true;
        }
        return false;
    }

    /**
     * Reset state to initial values
     */
    reset(path = '') {
        if (path === '') {
            this.state.clear();
            this.clearHistory();
            this.logger.debug('Reset entire state');
        } else {
            this.setState(path, undefined);
            this.logger.debug(`Reset state: ${path}`);
        }
    }

    /**
     * Check if path exists in state
     */
    has(path) {
        return this.getState(path) !== undefined;
    }

    /**
     * Merge state values
     */
    merge(path, value) {
        const current = this.getState(path) || {};
        const merged = this.mergeValues(current, value);
        return this.setState(path, merged);
    }

    /**
     * Batch update multiple state values
     */
    batch(updates) {
        const results = [];
        
        for (const [path, value] of Object.entries(updates)) {
            results.push(this.setState(path, value, { silent: true }));
        }
        
        // Notify all subscribers once
        this.notifyBatchSubscribers(Object.keys(updates));
        
        return results;
    }

    /**
     * Notify subscribers for batch updates
     */
    notifyBatchSubscribers(paths) {
        const notified = new Set();
        
        paths.forEach(path => {
            // Collect all affected subscribers
            const allPaths = [path, ...this.getParentPaths(path)];
            
            allPaths.forEach(p => {
                if (!notified.has(p) && this.subscribers.has(p)) {
                    const subscribers = this.subscribers.get(p);
                    for (const [, { callback }] of subscribers) {
                        try {
                            callback(this.getState(p), undefined, p);
                        } catch (error) {
                            this.logger.error(`Error in batch subscription callback for ${p}:`, error);
                        }
                    }
                    notified.add(p);
                }
            });
        });
    }

    /**
     * Utility methods
     */
    parsePath(path) {
        if (!path || typeof path !== 'string') {
            return [];
        }
        return path.split('.').filter(key => key !== '');
    }

    cloneValue(value) {
        if (value === null || value === undefined) {
            return value;
        }
        
        if (typeof value !== 'object') {
            return value;
        }
        
        if (Array.isArray(value)) {
            return [...value];
        }
        
        if (value instanceof Map) {
            return new Map(value);
        }
        
        if (value instanceof Set) {
            return new Set(value);
        }
        
        if (value instanceof Date) {
            return new Date(value);
        }
        
        if (value instanceof RegExp) {
            return new RegExp(value);
        }
        
        return { ...value };
    }

    isEqual(a, b) {
        if (a === b) return true;
        
        if (typeof a !== typeof b) return false;
        
        if (typeof a !== 'object' || a === null || b === null) {
            return a === b;
        }
        
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            return a.every((item, index) => this.isEqual(item, b[index]));
        }
        
        if (a instanceof Map && b instanceof Map) {
            if (a.size !== b.size) return false;
            for (const [key, value] of a) {
                if (!b.has(key) || !this.isEqual(value, b.get(key))) {
                    return false;
                }
            }
            return true;
        }
        
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        return keysA.every(key => this.isEqual(a[key], b[key]));
    }

    mergeValues(target, source) {
        if (typeof target !== 'object' || target === null ||
            typeof source !== 'object' || source === null) {
            return source;
        }
        
        if (Array.isArray(target) && Array.isArray(source)) {
            return [...target, ...source];
        }
        
        const result = { ...target };
        
        for (const [key, value] of Object.entries(source)) {
            if (key in result && typeof value === 'object' && value !== null) {
                result[key] = this.mergeValues(result[key], value);
            } else {
                result[key] = this.cloneValue(value);
            }
        }
        
        return result;
    }

    getParentPaths(path) {
        const keys = this.parsePath(path);
        const parents = [];
        
        for (let i = keys.length - 1; i > 0; i--) {
            parents.push(keys.slice(0, i).join('.'));
        }
        
        return parents;
    }

    /**
     * Destroy state manager
     */
    destroy() {
        this.subscribers.clear();
        this.middleware = [];
        this.history = [];
        this.state.clear();
        this.isInitialized = false;
        
        if (this.persistence) {
            this.persistence = null;
        }
        
        this.logger.debug('StateManager destroyed');
    }
}

export default StateManager;