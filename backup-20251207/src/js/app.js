/**
 * TextCleaner Pro - Main Application Bootstrap
 * @version 1.0.0
 * @author Professional Dev
 */

import AppConfig from './config.js';
import StateManager from './modules/core/state-manager.js';
import UIController from './modules/ui/ui-controller.js';
import TextProcessor from './modules/core/text-processor.js';
import StorageManager from './modules/storage/localStorage.js';

class TextCleanerApp {
    constructor() {
        this.config = AppConfig;
        this.state = new StateManager();
        this.ui = new UIController(this);
        this.processor = new TextProcessor();
        this.storage = new StorageManager();
        
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize modules in proper order
            await this.storage.init();
            await this.state.init(this.storage);
            await this.ui.init();
            
            // Register service worker for PWA
            await this.registerServiceWorker();
            
            // Load initial data
            await this.loadInitialData();
            
            // Bind global events
            this.bindGlobalEvents();
            
            // Update UI with initial state
            this.ui.update();
            
            console.log('TextCleaner Pro initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.ui.showError('Failed to initialize application');
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registered:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    console.log('New service worker version found');
                });
            } catch (error) {
                console.warn('ServiceWorker registration failed:', error);
            }
        }
    }

    async loadInitialData() {
        // Load saved presets
        const presets = await this.storage.get('presets');
        if (presets) {
            this.state.setPresets(presets);
        }

        // Load statistics
        const stats = await this.storage.get('stats');
        if (stats) {
            this.state.setStats(stats);
        }

        // Load user preferences
        const prefs = await this.storage.get('preferences');
        if (prefs) {
            this.state.setPreferences(prefs);
        }
    }

    bindGlobalEvents() {
        // Handle beforeunload to save state
        window.addEventListener('beforeunload', (e) => {
            this.saveAppState();
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.ui.showNotification('Back online', 'success');
        });

        window.addEventListener('offline', () => {
            this.ui.showNotification('Working offline', 'warning');
        });
    }

    async saveAppState() {
        try {
            await this.storage.set('presets', this.state.getPresets());
            await this.storage.set('stats', this.state.getStats());
            await this.storage.set('preferences', this.state.getPreferences());
        } catch (error) {
            console.error('Failed to save app state:', error);
        }
    }

    // Public API methods
    async processText(input, options = {}) {
        try {
            const result = await this.processor.process(input, options);
            
            // Update statistics
            this.state.updateStats({
                charactersProcessed: input.length,
                processingTime: result.metadata?.processingTime || 0
            });

            return result;
        } catch (error) {
            console.error('Text processing failed:', error);
            throw error;
        }
    }

    async batchProcess(files, options) {
        // Implementation for batch processing
    }

    async exportData(format = 'json') {
        // Implementation for data export
    }

    reset() {
        this.state.reset();
        this.ui.reset();
        this.ui.showNotification('Application reset', 'info');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.TextCleanerApp = new TextCleanerApp();
});

// Export for module usage
export default TextCleanerApp;