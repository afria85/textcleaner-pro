/**
 * Enhanced LocalStorage Manager
 * Professional localStorage wrapper with encryption, versioning, and migration support.
 */

import CryptoJS from 'crypto-js';

class LocalStorageManager {
  constructor(options = {}) {
    this.options = {
      prefix: 'tcp_',
      version: '1.0.0',
      encrypt: false,
      encryptionKey: null,
      compression: false,
      maxSize: 5 * 1024 * 1024, // 5MB
      migrate: true,
      ...options,
    };

    this.available = this.checkAvailability();
    this.stats = {
      reads: 0,
      writes: 0,
      deletes: 0,
      errors: 0,
      size: 0,
    };

    this.migrations = new Map();
    this.validators = new Map();

    this.init();
  }

  init() {
    if (!this.available) {
      console.warn('localStorage is not available');
      return;
    }

    // Load stats
    this.loadStats();

    // Run migrations if needed
    if (this.options.migrate) {
      this.runMigrations();
    }

    // Update size stats
    this.updateSizeStats();
  }

  // Core operations
  set(key, value, options = {}) {
    if (!this.available) return false;

    const finalKey = this.getKey(key);
    const finalOptions = { ...this.options, ...options };

    try {
      // Validate before storing
      this.validate(key, value);

      // Prepare data
      const data = {
        value,
        metadata: {
          version: finalOptions.version,
          timestamp: new Date().toISOString(),
          expiresAt: options.expiresAt,
          signature: this.createSignature(value),
        },
      };

      // Process data
      let processed = data;
      
      if (finalOptions.encrypt && finalOptions.encryptionKey) {
        processed = this.encryptData(processed);
      }

      if (finalOptions.compression) {
        processed = this.compressData(processed);
      }

      // Check size limit
      const size = this.calculateSize(finalKey, processed);
      if (size > this.options.maxSize) {
        throw new Error(`Data exceeds maximum size limit (${this.options.maxSize} bytes)`);
      }

      // Store data
      const serialized = JSON.stringify(processed);
      localStorage.setItem(finalKey, serialized);

      // Update stats
      this.stats.writes++;
      this.stats.size += size;
      this.saveStats();

      // Emit event
      this.emit('set', { key: finalKey, value, size });

      return true;

    } catch (error) {
      this.stats.errors++;
      this.saveStats();
      
      console.error('Failed to set item:', error);
      this.emit('error', { operation: 'set', key: finalKey, error });
      
      return false;
    }
  }

  get(key, defaultValue = null, options = {}) {
    if (!this.available) return defaultValue;

    const finalKey = this.getKey(key);
    const finalOptions = { ...this.options, ...options };

    try {
      // Get raw data
      const raw = localStorage.getItem(finalKey);
      if (raw === null) return defaultValue;

      let data;
      try {
        data = JSON.parse(raw);
      } catch (error) {
        console.warn('Failed to parse stored data:', error);
        this.remove(key); // Clean up corrupted data
        return defaultValue;
      }

      // Process data
      let processed = data;
      
      if (finalOptions.compression) {
        processed = this.decompressData(processed);
      }

      if (finalOptions.encrypt && finalOptions.encryptionKey) {
        processed = this.decryptData(processed);
      }

      // Validate data structure
      if (!processed || typeof processed !== 'object') {
        throw new Error('Invalid data structure');
      }

      // Check expiration
      if (processed.metadata?.expiresAt) {
        const expiresAt = new Date(processed.metadata.expiresAt);
        if (expiresAt < new Date()) {
          this.remove(key);
          return defaultValue;
        }
      }

      // Verify signature
      if (processed.metadata?.signature) {
        const expectedSignature = this.createSignature(processed.value);
        if (processed.metadata.signature !== expectedSignature) {
          throw new Error('Data integrity check failed');
        }
      }

      // Update stats
      this.stats.reads++;
      this.saveStats();

      // Emit event
      this.emit('get', { key: finalKey, value: processed.value });

      return processed.value;

    } catch (error) {
      this.stats.errors++;
      this.saveStats();
      
      console.error('Failed to get item:', error);
      this.emit('error', { operation: 'get', key: finalKey, error });
      
      return defaultValue;
    }
  }

  remove(key) {
    if (!this.available) return false;

    const finalKey = this.getKey(key);

    try {
      // Get size before removal for stats
      const raw = localStorage.getItem(finalKey);
      const size = raw ? new Blob([raw]).size : 0;

      localStorage.removeItem(finalKey);

      // Update stats
      this.stats.deletes++;
      this.stats.size = Math.max(0, this.stats.size - size);
      this.saveStats();

      // Emit event
      this.emit('remove', { key: finalKey });

      return true;

    } catch (error) {
      this.stats.errors++;
      this.saveStats();
      
      console.error('Failed to remove item:', error);
      this.emit('error', { operation: 'remove', key: finalKey, error });
      
      return false;
    }
  }

  clear() {
    if (!this.available) return false;

    try {
      const keys = this.keys();
      let removedCount = 0;

      for (const key of keys) {
        if (key.startsWith(this.options.prefix)) {
          localStorage.removeItem(key);
          removedCount++;
        }
      }

      // Reset stats
      this.stats = {
        reads: 0,
        writes: 0,
        deletes: removedCount,
        errors: 0,
        size: 0,
      };
      this.saveStats();

      // Emit event
      this.emit('clear', { removedCount });

      return true;

    } catch (error) {
      this.stats.errors++;
      this.saveStats();
      
      console.error('Failed to clear storage:', error);
      this.emit('error', { operation: 'clear', error });
      
      return false;
    }
  }

  // Utility methods
  getKey(key) {
    return `${this.options.prefix}${key}`;
  }

  keys() {
    if (!this.available) return [];
    
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    
    return keys.filter(key => key.startsWith(this.options.prefix));
  }

  has(key) {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  size() {
    return this.stats.size;
  }

  getStats() {
    return { ...this.stats };
  }

  // Migration support
  registerMigration(fromVersion, toVersion, migrationFn) {
    const key = `${fromVersion}_${toVersion}`;
    this.migrations.set(key, migrationFn);
  }

  runMigrations() {
    const currentVersion = this.options.version;
    const storedVersion = this.get('_version', '0.0.0');

    if (storedVersion === currentVersion) return;

    console.log(`Running migrations from ${storedVersion} to ${currentVersion}`);

    // Simple migration: clear old data and set new version
    // In real implementation, you'd have more sophisticated migration logic
    if (storedVersion !== currentVersion) {
      // Clear all old data
      this.clear();
      
      // Set new version
      this.set('_version', currentVersion, { encrypt: false });
    }
  }

  // Validation
  registerValidator(key, validatorFn) {
    this.validators.set(key, validatorFn);
  }

  validate(key, value) {
    const validator = this.validators.get(key);
    if (validator && !validator(value)) {
      throw new Error(`Validation failed for key: ${key}`);
    }
  }

  // Encryption
  encryptData(data) {
    if (!this.options.encryptionKey) {
      throw new Error('Encryption key is required for encryption');
    }

    const json = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(json, this.options.encryptionKey).toString();
    
    return {
      encrypted: true,
      data: encrypted,
    };
  }

  decryptData(encryptedData) {
    if (!encryptedData.encrypted) return encryptedData;
    
    if (!this.options.encryptionKey) {
      throw new Error('Encryption key is required for decryption');
    }

    const decrypted = CryptoJS.AES.decrypt(encryptedData.data, this.options.encryptionKey);
    const json = decrypted.toString(CryptoJS.enc.Utf8);
    
    return JSON.parse(json);
  }

  // Compression (simple implementation)
  compressData(data) {
    if (!this.options.compression) return data;
    
    const json = JSON.stringify(data);
    // Simple compression for demonstration
    // In production, use a proper compression library
    return {
      compressed: true,
      data: json, // Would be compressed in real implementation
    };
  }

  decompressData(compressedData) {
    if (!compressedData.compressed) return compressedData;
    
    // Simple decompression for demonstration
    return JSON.parse(compressedData.data);
  }

  // Signature
  createSignature(value) {
    const json = JSON.stringify(value);
    return CryptoJS.SHA256(json + this.options.version).toString();
  }

  // Stats management
  loadStats() {
    try {
      const saved = localStorage.getItem(`${this.options.prefix}_stats`);
      if (saved) {
        this.stats = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load stats:', error);
    }
  }

  saveStats() {
    try {
      localStorage.setItem(`${this.options.prefix}_stats`, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Failed to save stats:', error);
    }
  }

  updateSizeStats() {
    if (!this.available) return;

    let totalSize = 0;
    const keys = this.keys();

    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += new Blob([key, value]).size;
      }
    }

    this.stats.size = totalSize;
    this.saveStats();
  }

  calculateSize(key, value) {
    const json = JSON.stringify({ key, value });
    return new Blob([json]).size;
  }

  // Event system
  events = new Map();

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(listener);
  }

  off(event, listener) {
    if (this.events.has(event)) {
      this.events.get(event).delete(listener);
    }
  }

  emit(event, data) {
    if (this.events.has(event)) {
      for (const listener of this.events.get(event)) {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      }
    }
  }

  // Availability check
  checkAvailability() {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.error('localStorage is not available:', error);
      return false;
    }
  }

  // Backup and restore
  backup() {
    if (!this.available) return null;

    const backup = {};
    const keys = this.keys();

    for (const key of keys) {
      backup[key] = localStorage.getItem(key);
    }

    return {
      data: backup,
      timestamp: new Date().toISOString(),
      version: this.options.version,
      stats: this.getStats(),
    };
  }

  restore(backup) {
    if (!this.available || !backup?.data) return false;

    try {
      // Clear existing data
      this.clear();

      // Restore backup
      for (const [key, value] of Object.entries(backup.data)) {
        localStorage.setItem(key, value);
      }

      // Update stats
      this.updateSizeStats();

      this.emit('restore', { timestamp: backup.timestamp });
      return true;

    } catch (error) {
      console.error('Failed to restore backup:', error);
      this.emit('error', { operation: 'restore', error });
      return false;
    }
  }

  destroy() {
    this.events.clear();
    this.migrations.clear();
    this.validators.clear();
  }
}

export default LocalStorageManager;