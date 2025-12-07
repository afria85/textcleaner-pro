/**
 * Enhanced Event Emitter
 * Type-safe event emitter with debugging, memory management, and error handling.
 */

class EventEmitter {
  constructor() {
    this.events = new Map();
    this.maxListeners = 10;
    this.debug = false;
    this.eventHistory = [];
    this.maxHistory = 100;
  }

  on(event, listener, options = {}) {
    this.validateEvent(event);
    this.validateListener(listener);

    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const eventSet = this.events.get(event);
    
    // Check for max listeners
    if (eventSet.size >= this.maxListeners) {
      console.warn(`Event "${event}" has ${eventSet.size} listeners, maximum is ${this.maxListeners}`);
    }

    const wrapper = {
      listener,
      once: options.once || false,
      context: options.context || null,
      id: Symbol(`listener_${event}`),
    };

    eventSet.add(wrapper);

    if (this.debug) {
      console.debug(`Listener added to "${event}"`, { listenerId: wrapper.id });
    }

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  once(event, listener, context = null) {
    return this.on(event, listener, { once: true, context });
  }

  off(event, listener) {
    this.validateEvent(event);
    
    if (!this.events.has(event)) {
      return false;
    }

    const eventSet = this.events.get(event);
    let removed = false;

    for (const wrapper of eventSet) {
      if (wrapper.listener === listener) {
        eventSet.delete(wrapper);
        removed = true;
        
        if (this.debug) {
          console.debug(`Listener removed from "${event}"`, { listenerId: wrapper.id });
        }
        break;
      }
    }

    // Clean up empty event sets
    if (eventSet.size === 0) {
      this.events.delete(event);
    }

    return removed;
  }

  emit(event, ...args) {
    this.validateEvent(event);

    if (!this.events.has(event)) {
      if (this.debug) {
        console.debug(`No listeners for "${event}"`);
      }
      return false;
    }

    const eventSet = this.events.get(event);
    const results = [];
    const wrappersToRemove = [];

    // Record event in history
    this.recordEvent(event, args);

    // Call all listeners
    for (const wrapper of eventSet) {
      try {
        const result = wrapper.listener.apply(wrapper.context, args);
        results.push(result);

        // Mark for removal if it's a once listener
        if (wrapper.once) {
          wrappersToRemove.push(wrapper);
        }
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
        this.emit('error', error, event, wrapper);
      }
    }

    // Remove once listeners
    for (const wrapper of wrappersToRemove) {
      eventSet.delete(wrapper);
    }

    // Clean up empty event sets
    if (eventSet.size === 0) {
      this.events.delete(event);
    }

    if (this.debug) {
      console.debug(`Event "${event}" emitted`, {
        listeners: eventSet.size,
        results,
        args,
      });
    }

    return results;
  }

  removeAllListeners(event = null) {
    if (event) {
      if (this.debug) {
        console.debug(`Removing all listeners for "${event}"`);
      }
      this.events.delete(event);
    } else {
      if (this.debug) {
        console.debug('Removing all listeners');
      }
      this.events.clear();
    }
  }

  listenerCount(event) {
    if (!this.events.has(event)) return 0;
    return this.events.get(event).size;
  }

  listeners(event) {
    if (!this.events.has(event)) return [];
    const eventSet = this.events.get(event);
    return Array.from(eventSet).map(wrapper => wrapper.listener);
  }

  eventNames() {
    return Array.from(this.events.keys());
  }

  setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0) {
      throw new TypeError('n must be a non-negative number');
    }
    this.maxListeners = n;
    return this;
  }

  getMaxListeners() {
    return this.maxListeners;
  }

  prependListener(event, listener, context = null) {
    // Note: Since we're using Set, order isn't guaranteed
    // This is for API compatibility
    return this.on(event, listener, { context });
  }

  prependOnceListener(event, listener, context = null) {
    return this.once(event, listener, context);
  }

  rawListeners(event) {
    return this.listeners(event);
  }

  // Utility methods
  validateEvent(event) {
    if (typeof event !== 'string' || event.trim() === '') {
      throw new TypeError('Event name must be a non-empty string');
    }
  }

  validateListener(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }
  }

  recordEvent(event, args) {
    const entry = {
      event,
      timestamp: new Date().toISOString(),
      args: this.sanitizeArgs(args),
      listeners: this.listenerCount(event),
    };

    this.eventHistory.unshift(entry);

    // Limit history size
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistory);
    }
  }

  sanitizeArgs(args) {
    try {
      return args.map(arg => {
        if (typeof arg === 'function') return '[Function]';
        if (typeof arg === 'object' && arg !== null) {
          // Avoid circular references and large objects
          return JSON.stringify(arg, (key, value) => {
            if (typeof value === 'function') return '[Function]';
            if (value instanceof Error) return value.toString();
            return value;
          });
        }
        return arg;
      });
    } catch (error) {
      return ['[Unserializable arguments]'];
    }
  }

  getEventHistory(filter = {}) {
    let filtered = this.eventHistory;

    if (filter.event) {
      filtered = filtered.filter(entry => entry.event === filter.event);
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

  clearEventHistory() {
    this.eventHistory = [];
  }

  enableDebug() {
    this.debug = true;
    console.debug('EventEmitter debug enabled');
  }

  disableDebug() {
    this.debug = false;
  }

  // Wait for specific event
  waitFor(event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, handler);
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      const handler = (...args) => {
        clearTimeout(timer);
        resolve(args);
      };

      this.once(event, handler);
    });
  }

  // Create namespaced emitter
  createNamespace(namespace) {
    return {
      on: (event, listener, options) => 
        this.on(`${namespace}:${event}`, listener, options),
      once: (event, listener, options) => 
        this.once(`${namespace}:${event}`, listener, options),
      off: (event, listener) => 
        this.off(`${namespace}:${event}`, listener),
      emit: (event, ...args) => 
        this.emit(`${namespace}:${event}`, ...args),
      waitFor: (event, timeout) => 
        this.waitFor(`${namespace}:${event}`, timeout),
    };
  }

  destroy() {
    this.removeAllListeners();
    this.clearEventHistory();
    this.events.clear();
  }
}

export default EventEmitter;