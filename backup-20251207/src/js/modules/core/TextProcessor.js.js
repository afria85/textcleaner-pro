/**
 * Text Processing Engine
 * Core text processing with error handling, logging, and performance tracking.
 */

import Logger from '../utils/Logger.js';
import EventEmitter from '../utils/EventEmitter.js';

class TextProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.logger = new Logger('TextProcessor');
    this.cleaners = new Map();
    this.options = {
      timeout: 30000,
      maxRetries: 3,
      chunkSize: 10000,
      ...options,
    };
    
    this.stats = {
      processed: 0,
      failed: 0,
      totalTime: 0,
      avgTime: 0,
    };
    
    this.init();
  }

  init() {
    this.logger.info('Initializing text processor');
    this.registerDefaultCleaners();
  }

  registerDefaultCleaners() {
    // Register built-in cleaners
    this.registerCleaner('general', this.generalCleaner.bind(this));
    this.registerCleaner('csv', this.csvCleaner.bind(this));
    this.registerCleaner('json', this.jsonCleaner.bind(this));
    this.registerCleaner('html', this.htmlCleaner.bind(this));
  }

  registerCleaner(name, cleanerFn) {
    if (typeof cleanerFn !== 'function') {
      throw new Error('Cleaner must be a function');
    }

    this.cleaners.set(name, cleanerFn);
    this.logger.debug(`Registered cleaner: ${name}`);
    this.emit('cleaner:registered', { name });
  }

  async process(text, cleanerName = 'general', options = {}) {
    const startTime = performance.now();
    const processId = `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.info(`Processing text with ${cleanerName}`, { 
      processId, 
      textLength: text.length,
      cleaner: cleanerName,
    });

    try {
      // Validate input
      this.validateInput(text);
      
      // Get cleaner
      const cleaner = this.cleaners.get(cleanerName);
      if (!cleaner) {
        throw new Error(`Cleaner "${cleanerName}" not found`);
      }

      // Emit start event
      this.emit('process:start', { 
        processId, 
        textLength: text.length,
        cleaner: cleanerName,
      });

      // Process with timeout
      const result = await this.withTimeout(
        cleaner(text, options),
        this.options.timeout,
        `Processing timeout after ${this.options.timeout}ms`
      );

      // Calculate metrics
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Update stats
      this.updateStats(processingTime, true);

      // Emit success event
      this.emit('process:complete', {
        processId,
        textLength: text.length,
        resultLength: result.output?.length || 0,
        processingTime,
        cleaner: cleanerName,
        success: true,
      });

      this.logger.info(`Processing completed`, {
        processId,
        processingTime: `${processingTime.toFixed(2)}ms`,
        reduction: this.calculateReduction(text, result.output),
      });

      return {
        ...result,
        metadata: {
          processId,
          processingTime,
          cleaner: cleanerName,
          timestamp: new Date().toISOString(),
          stats: this.getStats(),
        },
      };

    } catch (error) {
      // Update stats
      this.updateStats(performance.now() - startTime, false);

      // Emit error event
      this.emit('process:error', {
        processId,
        error: error.message,
        cleaner: cleanerName,
        textLength: text.length,
      });

      this.logger.error('Processing failed', {
        processId,
        error: error.message,
        stack: error.stack,
      });

      // Re-throw with additional context
      throw new Error(`Text processing failed: ${error.message}`, {
        cause: error,
        details: {
          processId,
          cleaner: cleanerName,
          textLength: text.length,
        },
      });
    }
  }

  async batchProcess(items, cleanerName, options = {}) {
    const batchId = `batch_${Date.now()}`;
    const results = [];
    const errors = [];

    this.logger.info('Starting batch processing', { 
      batchId, 
      itemCount: items.length,
      cleaner: cleanerName,
    });

    this.emit('batch:start', { batchId, itemCount: items.length });

    for (let i = 0; i < items.length; i++) {
      try {
        const result = await this.process(items[i], cleanerName, options);
        results.push({
          index: i,
          success: true,
          ...result,
        });

        // Emit progress
        this.emit('batch:progress', {
          batchId,
          processed: i + 1,
          total: items.length,
          percentage: ((i + 1) / items.length) * 100,
        });

      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          item: items[i].substring(0, 100) + '...', // Truncate for logging
        });
      }
    }

    const batchResult = {
      batchId,
      total: items.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
      completedAt: new Date().toISOString(),
    };

    this.emit('batch:complete', batchResult);
    this.logger.info('Batch processing completed', batchResult);

    return batchResult;
  }

  // Built-in cleaners
  generalCleaner(text, options = {}) {
    const defaults = {
      trim: true,
      removeEmptyLines: true,
      normalizeLineEndings: true,
      removeExtraSpaces: true,
      preserveFormatting: false,
    };

    const opts = { ...defaults, ...options };
    let result = text;

    if (opts.trim) {
      result = result.trim();
    }

    if (opts.removeEmptyLines) {
      result = result.split('\n').filter(line => line.trim() !== '').join('\n');
    }

    if (opts.normalizeLineEndings) {
      result = result.replace(/\r\n|\r/g, '\n');
    }

    if (opts.removeExtraSpaces) {
      result = result.replace(/\s+/g, ' ');
    }

    return {
      output: result,
      metadata: {
        operations: Object.keys(opts).filter(k => opts[k]),
        originalLength: text.length,
        processedLength: result.length,
      },
    };
  }

  csvCleaner(text, options = {}) {
    // CSV cleaning logic
    // This is a simplified version - real implementation would be more complex
    const opts = {
      delimiter: ',',
      hasHeader: true,
      trimFields: true,
      removeEmptyRows: true,
      ...options,
    };

    // Basic CSV parsing and cleaning
    const lines = text.split('\n');
    const cleanedLines = [];

    for (const line of lines) {
      if (opts.removeEmptyRows && line.trim() === '') continue;
      
      let cleanedLine = line;
      if (opts.trimFields) {
        cleanedLine = line.split(opts.delimiter)
          .map(field => field.trim())
          .join(opts.delimiter);
      }
      
      cleanedLines.push(cleanedLine);
    }

    const result = cleanedLines.join('\n');

    return {
      output: result,
      metadata: {
        rowCount: cleanedLines.length,
        delimiter: opts.delimiter,
        hasHeader: opts.hasHeader,
      },
    };
  }

  jsonCleaner(text, options = {}) {
    const opts = {
      indentSize: 2,
      sortKeys: false,
      removeNulls: false,
      minify: false,
      ...options,
    };

    try {
      let parsed = JSON.parse(text);
      
      if (opts.removeNulls) {
        parsed = this.removeNullValues(parsed);
      }

      if (opts.sortKeys) {
        parsed = this.sortObjectKeys(parsed);
      }

      const output = opts.minify 
        ? JSON.stringify(parsed)
        : JSON.stringify(parsed, null, opts.indentSize);

      return {
        output,
        metadata: {
          isValid: true,
          minified: opts.minify,
          indentSize: opts.indentSize,
        },
      };

    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  htmlCleaner(text, options = {}) {
    // Basic HTML cleaning (sanitization)
    const opts = {
      removeScripts: true,
      removeStyles: false,
      removeComments: false,
      minify: false,
      ...options,
    };

    let result = text;

    if (opts.removeScripts) {
      result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    if (opts.removeStyles) {
      result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    }

    if (opts.removeComments) {
      result = result.replace(/<!--[\s\S]*?-->/g, '');
    }

    if (opts.minify) {
      result = result.replace(/\s+/g, ' ').trim();
    }

    return {
      output: result,
      metadata: {
        removedScripts: opts.removeScripts,
        removedComments: opts.removeComments,
        minified: opts.minify,
      },
    };
  }

  // Utility methods
  validateInput(text) {
    if (typeof text !== 'string') {
      throw new TypeError('Input must be a string');
    }

    if (text.length === 0) {
      throw new Error('Input cannot be empty');
    }

    if (text.length > 10 * 1024 * 1024) { // 10MB
      throw new Error('Input too large. Maximum size is 10MB');
    }

    return true;
  }

  async withTimeout(promise, timeout, errorMessage = 'Operation timeout') {
    let timeoutId;
    
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeout);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  updateStats(processingTime, success) {
    this.stats.totalTime += processingTime;
    
    if (success) {
      this.stats.processed++;
    } else {
      this.stats.failed++;
    }
    
    this.stats.avgTime = this.stats.totalTime / (this.stats.processed + this.stats.failed);
  }

  calculateReduction(original, processed) {
    if (!processed) return '0%';
    const reduction = ((original.length - processed.length) / original.length) * 100;
    return reduction.toFixed(2) + '%';
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = {
      processed: 0,
      failed: 0,
      totalTime: 0,
      avgTime: 0,
    };
  }

  removeNullValues(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeNullValues(item)).filter(item => item !== null);
    } else if (obj !== null && typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = this.removeNullValues(value);
        if (cleanedValue !== null) {
          cleaned[key] = cleanedValue;
        }
      }
      return cleaned;
    }
    return obj;
  }

  sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((sorted, key) => {
          sorted[key] = this.sortObjectKeys(obj[key]);
          return sorted;
        }, {});
    }
    return obj;
  }

  destroy() {
    this.cleaners.clear();
    this.removeAllListeners();
    this.logger.info('Text processor destroyed');
  }
}

export default TextProcessor;