/**
 * Cleaner Factory - Manages all text cleaners
 * Factory pattern for cleaner instantiation
 */

import GeneralCleaner from './text-formatter.js';
import CSVProcessor from './csv-processor.js';
import JSONProcessor from './json-processor.js';
import SocialCleaner from './social-cleaner.js';

class CleanerFactory {
    constructor() {
        this.cleaners = new Map();
        this.registerDefaults();
    }

    registerDefaults() {
        this.register('general', new GeneralCleaner());
        this.register('csv', new CSVProcessor());
        this.register('json', new JSONProcessor());
        this.register('social', new SocialCleaner());
        // Add more cleaners here...
    }

    register(id, cleaner) {
        if (this.cleaners.has(id)) {
            console.warn(`Cleaner "${id}" already registered, overwriting`);
        }
        
        // Validate cleaner interface
        if (!cleaner.process || typeof cleaner.process !== 'function') {
            throw new Error(`Cleaner "${id}" must implement process() method`);
        }
        
        this.cleaners.set(id, cleaner);
    }

    get(id) {
        const cleaner = this.cleaners.get(id);
        if (!cleaner) {
            throw new Error(`Cleaner "${id}" not found`);
        }
        return cleaner;
    }

    list() {
        return Array.from(this.cleaners.entries()).map(([id, cleaner]) => ({
            id,
            name: cleaner.name || id,
            description: cleaner.description || '',
            supportedFormats: cleaner.supportedFormats || [],
        }));
    }

    async process(id, input, options = {}) {
        const cleaner = this.get(id);
        return await cleaner.process(input, options);
    }
}

// Create singleton instance
const factory = new CleanerFactory();

// Export singleton instance
export default factory;