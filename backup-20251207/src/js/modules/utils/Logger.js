/**
 * Professional Logger Utility
 * Enterprise-grade logging with multiple levels, formatting, and persistence.
 */

class Logger {
  static LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4,
  };

  static COLORS = {
    ERROR: '#ef4444',
    WARN: '#f59e0b',
    INFO: '#3b82f6',
    DEBUG: '#10b981',
    TRACE: '#8b5cf6',
    RESET: '#9ca3af',
  };

  constructor(name = 'App', options = {}) {
    this.name = name;
    this.options = {
      level: process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG',
      timestamp: true,
      colors: true,
      persist: true,
      maxEntries: 1000,
      ...options,
    };

    this.level = Logger.LEVELS[this.options.level.toUpperCase()] || Logger.LEVELS.INFO;
    this.history = [];
    this.subscribers = new Set();

    // Bind methods
    this.error = this.error.bind(this);
    this.warn = this.warn.bind(this);
    this.info = this.info.bind(this);
    this.debug = this.debug.bind(this);
    this.trace = this.trace.bind(this);

    this.init();
  }

  init() {
    // Load history from storage if persist is enabled
    if (this.options.persist && typeof window !== 'undefined') {
      this.loadHistory();
    }

    // Register global error handler
    if (typeof window !== 'undefined') {
      this.registerGlobalHandlers();
    }

    this.info('Logger initialized', { level: this.options.level });
  }

  registerGlobalHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString(),
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason?.toString(),
      });
    });
  }

  log(level, message, data = {}) {
    // Check if level is enabled
    if (Logger.LEVELS[level] > this.level) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      level,
      timestamp,
      name: this.name,
      message,
      data: this.sanitizeData(data),
      id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Format and output
    const formatted = this.formatEntry(logEntry);
    this.output(level, formatted, logEntry);

    // Store in history
    this.addToHistory(logEntry);

    // Notify subscribers
    this.notifySubscribers(logEntry);

    return logEntry;
  }

  error(message, data) {
    return this.log('ERROR', message, data);
  }

  warn(message, data) {
    return this.log('WARN', message, data);
  }

  info(message, data) {
    return this.log('INFO', message, data);
  }

  debug(message, data) {
    return this.log('DEBUG', message, data);
  }

  trace(message, data) {
    return this.log('TRACE', message, data);
  }

  formatEntry(entry) {
    const parts = [];

    if (this.options.timestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    if (this.options.colors) {
      const color = Logger.COLORS[entry.level] || Logger.COLORS.RESET;
      parts.push(`%c${entry.level}%c`);
      parts.push(`[${entry.name}]`);
      parts.push(entry.message);
      
      const formatted = parts.join(' ');
      return [
        formatted,
        `color: ${color}; font-weight: bold;`,
        'color: inherit; font-weight: normal;',
        entry.data,
      ];
    } else {
      parts.push(`[${entry.level}]`);
      parts.push(`[${entry.name}]`);
      parts.push(entry.message);
      return [parts.join(' '), entry.data];
    }
  }

  output(level, args) {
    const consoleMethod = console[level.toLowerCase()] || console.log;
    
    try {
      consoleMethod(...args);
    } catch (error) {
      // Fallback if console method fails
      console.log(...args);
    }
  }

  addToHistory(entry) {
    this.history.unshift(entry);
    
    // Limit history size
    if (this.history.length > this.options.maxEntries) {
      this.history = this.history.slice(0, this.options.maxEntries);
    }

    // Persist if enabled
    if (this.options.persist) {
      this.saveHistory();
    }
  }

  saveHistory() {
    try {
      localStorage.setItem(`logger_${this.name}`, JSON.stringify({
        history: this.history.slice(0, 100), // Save only last 100 entries
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      // Storage might be full or not available
      console.warn('Failed to save log history:', error);
    }
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem(`logger_${this.name}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.history = parsed.history || [];
      }
    } catch (error) {
      console.warn('Failed to load log history:', error);
    }
  }

  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    
    // Remove sensitive information
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credit', 'ssn'];
    
    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
      
      // Recursively sanitize nested objects
      if (sanitized[key] && typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  }

  notifySubscribers(entry) {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(entry);
      } catch (error) {
        console.error('Log subscriber error:', error);
      }
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  getHistory(filter = {}) {
    let filtered = this.history;

    if (filter.level) {
      const levelNum = Logger.LEVELS[filter.level.toUpperCase()];
      if (levelNum !== undefined) {
        filtered = filtered.filter(entry => Logger.LEVELS[entry.level] <= levelNum);
      }
    }

    if (filter.since) {
      const sinceDate = new Date(filter.since);
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= sinceDate);
    }

    if (filter.until) {
      const untilDate = new Date(filter.until);
      filtered = filtered.filter(entry => new Date(entry.timestamp) <= untilDate);
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  clearHistory() {
    this.history = [];
    
    if (this.options.persist) {
      localStorage.removeItem(`logger_${this.name}`);
    }
  }

  setLevel(level) {
    const newLevel = Logger.LEVELS[level.toUpperCase()];
    if (newLevel === undefined) {
      this.warn('Invalid log level', { requested: level });
      return;
    }

    const oldLevel = this.options.level;
    this.level = newLevel;
    this.options.level = level;

    this.info('Log level changed', { from: oldLevel, to: level });
  }

  createChild(name) {
    return new Logger(`${this.name}.${name}`, this.options);
  }

  destroy() {
    this.subscribers.clear();
    this.clearHistory();
    this.info('Logger destroyed');
  }
}

export default Logger;