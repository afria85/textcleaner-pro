/**
 * Event Bus System
 * Pub/Sub event system for application-wide communication
 */

class EventBus {
    constructor() {
        this.events = new Map();
        this.middleware = [];
        this.history = [];
        this.maxHistory = 100;
        this.isEnabled = true;
    }

    /**
     * Subscribe to an event
     */
    on(event, callback, options = {}) {
        if (!this.isEnabled) {
            console.warn(`Event bus disabled, cannot subscribe to: ${event}`);
            return () => {};
        }

        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }

        const eventSet = this.events.get(event);
        const handler = {
            callback,
            once: options.once || false,
            priority: options.priority || 0,
            context: options.context || null,
            id: Symbol(`${event}-handler`),
        };

        eventSet.add(handler);

        // Sort handlers by priority (higher priority first)
        const sortedHandlers = Array.from(eventSet).sort((a, b) => b.priority - a.priority);
        this.events.set(event, new Set(sortedHandlers));

        console.debug(`Subscribed to event: ${event}`, { handlerId: handler.id });

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once
     */
    once(event, callback, options = {}) {
        return this.on(event, callback, { ...options, once: true });
    }

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (!this.events.has(event)) {
            return false;
        }

        const eventSet = this.events.get(event);
        const initialSize = eventSet.size;

        for (const handler of eventSet) {
            if (handler.callback === callback) {
                eventSet.delete(handler);
                console.debug(`Unsubscribed from event: ${event}`, { handlerId: handler.id });
                break;
            }
        }

        if (eventSet.size === 0) {
            this.events.delete(event);
        }

        return eventSet.size < initialSize;
    }

    /**
     * Emit an event
     */
    emit(event, data = null) {
        if (!this.isEnabled) {
            console.warn(`Event bus disabled, cannot emit: ${event}`);
            return false;
        }

        // Record event in history
        this.recordEvent(event, data);

        // Run middleware before emission
        const middlewareResult = this.runMiddleware(event, data);
        if (middlewareResult.preventEmission) {
            console.debug(`Event emission prevented by middleware: ${event}`);
            return false;
        }

        const processedData = middlewareResult.data || data;

        if (!this.events.has(event)) {
            console.debug(`No subscribers for event: ${event}`);
            return false;
        }

        const eventSet = this.events.get(event);
        const results = [];
        const handlersToRemove = [];

        // Execute all handlers
        for (const handler of eventSet) {
            try {
                const result = handler.callback.call(handler.context, processedData, event);
                results.push(result);

                // Mark for removal if it's a once handler
                if (handler.once) {
                    handlersToRemove.push(handler);
                }
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
                this.handleHandlerError(error, event, handler, processedData);
            }
        }

        // Remove once handlers
        for (const handler of handlersToRemove) {
            eventSet.delete(handler);
        }

        if (eventSet.size === 0) {
            this.events.delete(event);
        }

        console.debug(`Emitted event: ${event}`, {
            subscribers: eventSet.size,
            data: processedData,
        });

        return results;
    }

    /**
     * Record event in history
     */
    recordEvent(event, data) {
        const record = {
            event,
            data,
            timestamp: Date.now(),
            stack: new Error().stack, // Capture stack trace for debugging
        };

        this.history.unshift(record);

        // Keep history size manageable
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
    }

    /**
     * Run middleware before event emission
     */
    runMiddleware(event, data) {
        let processedData = data;
        let preventEmission = false;

        for (const middleware of this.middleware) {
            try {
                const result = middleware(event, processedData);
                if (result && typeof result === 'object') {
                    if (result.preventEmission) {
                        preventEmission = true;
                    }
                    if (result.data !== undefined) {
                        processedData = result.data;
                    }
                }
            } catch (error) {
                console.error(`Error in event middleware for ${event}:`, error);
            }
        }

        return { preventEmission, data: processedData };
    }

    /**
     * Handle handler error
     */
    handleHandlerError(error, event, handler, data) {
        // Emit error event
        this.emit('event:handler:error', {
            event,
            error,
            handler,
            data,
            timestamp: Date.now(),
        });

        // Log error details
        console.error('Event handler error:', {
            event,
            handlerId: handler.id,
            error: error.message,
            stack: error.stack,
        });
    }

    /**
     * Add middleware
     */
    use(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }

        this.middleware.push(middleware);
        console.debug('Added event middleware');
        return () => this.removeMiddleware(middleware);
    }

    /**
     * Remove middleware
     */
    removeMiddleware(middleware) {
        const index = this.middleware.indexOf(middleware);
        if (index !== -1) {
            this.middleware.splice(index, 1);
            console.debug('Removed event middleware');
            return true;
        }
        return false;
    }

    /**
     * Get event history
     */
    getHistory(filter = {}) {
        let filteredHistory = this.history;

        if (filter.event) {
            filteredHistory = filteredHistory.filter(record => record.event === filter.event);
        }

        if (filter.since) {
            filteredHistory = filteredHistory.filter(record => record.timestamp >= filter.since);
        }

        if (filter.until) {
            filteredHistory = filteredHistory.filter(record => record.timestamp <= filter.until);
        }

        if (filter.limit) {
            filteredHistory = filteredHistory.slice(0, filter.limit);
        }

        return filteredHistory;
    }

    /**
     * Clear event history
     */
    clearHistory() {
        this.history = [];
        console.debug('Cleared event history');
    }

    /**
     * Get subscriber count for an event
     */
    getSubscriberCount(event) {
        if (!this.events.has(event)) {
            return 0;
        }
        return this.events.get(event).size;
    }

    /**
     * Check if event has subscribers
     */
    hasSubscribers(event) {
        return this.getSubscriberCount(event) > 0;
    }

    /**
     * List all registered events
     */
    getRegisteredEvents() {
        return Array.from(this.events.keys());
    }

    /**
     * Enable event bus
     */
    enable() {
        this.isEnabled = true;
        console.debug('Event bus enabled');
    }

    /**
     * Disable event bus
     */
    disable() {
        this.isEnabled = false;
        console.debug('Event bus disabled');
    }

    /**
     * Remove all event listeners
     */
    removeAllListeners(event = null) {
        if (event) {
            if (this.events.has(event)) {
                this.events.delete(event);
                console.debug(`Removed all listeners for event: ${event}`);
            }
        } else {
            this.events.clear();
            console.debug('Removed all event listeners');
        }
    }

    /**
     * Wait for an event
     */
    waitFor(event, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                unsubscribe();
                reject(new Error(`Timeout waiting for event: ${event}`));
            }, timeout);

            const unsubscribe = this.on(event, (data) => {
                clearTimeout(timer);
                unsubscribe();
                resolve(data);
            }, { once: true });
        });
    }

    /**
     * Create a namespaced event bus
     */
    createNamespace(namespace) {
        return {
            on: (event, callback, options) => 
                this.on(`${namespace}:${event}`, callback, options),
            once: (event, callback, options) => 
                this.once(`${namespace}:${event}`, callback, options),
            off: (event, callback) => 
                this.off(`${namespace}:${event}`, callback),
            emit: (event, data) => 
                this.emit(`${namespace}:${event}`, data),
            waitFor: (event, timeout) => 
                this.waitFor(`${namespace}:${event}`, timeout),
        };
    }

    /**
     * Destroy event bus
     */
    destroy() {
        this.removeAllListeners();
        this.middleware = [];
        this.history = [];
        this.isEnabled = false;
        console.debug('Event bus destroyed');
    }
}

export default EventBus;