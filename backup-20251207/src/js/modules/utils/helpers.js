/**
 * Helpers - General utility functions
 */

class Helpers {
    constructor() {
        // Bind methods to preserve 'this' context
        this.debounce = this.debounce.bind(this);
        this.throttle = this.throttle.bind(this);
    }

    // Debounce function
    debounce(func, wait, immediate = false) {
        let timeout;
        
        return function executedFunction(...args) {
            const context = this;
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func.apply(context, args);
        };
    }

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Deep clone object
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof RegExp) return new RegExp(obj);
        if (obj instanceof Map) return new Map(Array.from(obj.entries()));
        if (obj instanceof Set) return new Set(Array.from(obj.values()));
        
        const clone = Array.isArray(obj) ? [] : {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clone[key] = this.deepClone(obj[key]);
            }
        }
        
        return clone;
    }

    // Merge objects deeply
    deepMerge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        
        return this.deepMerge(target, ...sources);
    }

    // Check if value is an object
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    // Generate unique ID
    generateId(length = 8) {
        return Math.random().toString(36).substr(2, length);
    }

    // Generate UUID v4
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Format bytes to human readable size
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Parse bytes from string
    parseBytes(sizeString) {
        const units = {
            B: 1,
            KB: 1024,
            MB: 1024 * 1024,
            GB: 1024 * 1024 * 1024,
            TB: 1024 * 1024 * 1024 * 1024
        };
        
        const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*([KMGTP]?B)$/i);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        return value * (units[unit] || 1);
    }

    // Format time duration
    formatDuration(ms, format = 'auto') {
        if (format === 'auto') {
            if (ms < 1000) return `${ms}ms`;
            if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
            if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
            return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
        }
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        switch (format) {
            case 'short':
                if (days > 0) return `${days}d`;
                if (hours > 0) return `${hours}h`;
                if (minutes > 0) return `${minutes}m`;
                return `${seconds}s`;
                
            case 'long':
                const parts = [];
                if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
                if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`);
                if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`);
                if (seconds % 60 > 0) parts.push(`${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`);
                return parts.join(' ') || '0 seconds';
                
            default:
                return ms + 'ms';
        }
    }

    // Format date
    formatDate(date, format = 'iso') {
        const d = new Date(date);
        
        switch (format) {
            case 'iso':
                return d.toISOString();
            case 'date':
                return d.toLocaleDateString();
            case 'time':
                return d.toLocaleTimeString();
            case 'datetime':
                return d.toLocaleString();
            case 'relative':
                return this.relativeTime(d);
            default:
                return d.toString();
        }
    }

    // Relative time (e.g., "2 hours ago")
    relativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;
        const month = 30 * day;
        const year = 365 * day;
        
        if (diff < minute) return 'just now';
        if (diff < hour) return `${Math.floor(diff / minute)} minutes ago`;
        if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
        if (diff < week) return `${Math.floor(diff / day)} days ago`;
        if (diff < month) return `${Math.floor(diff / week)} weeks ago`;
        if (diff < year) return `${Math.floor(diff / month)} months ago`;
        return `${Math.floor(diff / year)} years ago`;
    }

    // Truncate text with ellipsis
    truncate(text, maxLength = 100, ellipsis = '...') {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - ellipsis.length) + ellipsis;
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Unescape HTML
    unescapeHtml(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    // Generate random string
    randomString(length = 10, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    // Generate random number in range
    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Sleep/pause execution
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Retry async function
    async retry(fn, retries = 3, delay = 1000) {
        try {
            return await fn();
        } catch (error) {
            if (retries === 0) throw error;
            await this.sleep(delay);
            return this.retry(fn, retries - 1, delay * 2); // Exponential backoff
        }
    }

    // Memoize function
    memoize(fn) {
        const cache = new Map();
        return function(...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = fn.apply(this, args);
            cache.set(key, result);
            return result;
        };
    }

    // Pipe functions
    pipe(...fns) {
        return function(x) {
            return fns.reduce((v, f) => f(v), x);
        };
    }

    // Compose functions
    compose(...fns) {
        return function(x) {
            return fns.reduceRight((v, f) => f(v), x);
        };
    }

    // Capitalize first letter
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    // Camel case to kebab case
    camelToKebab(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    // Kebab case to camel case
    kebabToCamel(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    // Snake case to camel case
    snakeToCamel(str) {
        return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    }

    // Remove duplicates from array
    unique(array) {
        return [...new Set(array)];
    }

    // Flatten array
    flatten(array) {
        return array.reduce((flat, item) => {
            return flat.concat(Array.isArray(item) ? this.flatten(item) : item);
        }, []);
    }

    // Chunk array
    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    // Shuffle array
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Sort array by property
    sortBy(array, property, order = 'asc') {
        return [...array].sort((a, b) => {
            let aVal = a[property];
            let bVal = b[property];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Group array by property
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    }

    // Pick properties from object
    pick(obj, keys) {
        return keys.reduce((result, key) => {
            if (obj.hasOwnProperty(key)) {
                result[key] = obj[key];
            }
            return result;
        }, {});
    }

    // Omit properties from object
    omit(obj, keys) {
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
    }

    // Get nested property value
    get(obj, path, defaultValue = undefined) {
        const travel = regexp =>
            String.prototype.split
                .call(path, regexp)
                .filter(Boolean)
                .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
        const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
        return result === undefined || result === obj ? defaultValue : result;
    }

    // Set nested property value
    set(obj, path, value) {
        if (Object(obj) !== obj) return obj;
        if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || [];
        path.slice(0, -1).reduce((a, c, i) =>
            Object(a[c]) === a[c]
                ? a[c]
                : a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1] ? [] : {},
            obj)[path[path.length - 1]] = value;
        return obj;
    }

    // Clone and set nested property
    cloneAndSet(obj, path, value) {
        const cloned = this.deepClone(obj);
        return this.set(cloned, path, value);
    }

    // Query string utilities
    parseQueryString(query) {
        return (query.startsWith('?') ? query.substr(1) : query)
            .split('&')
            .reduce((params, param) => {
                const [key, value] = param.split('=');
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
                return params;
            }, {});
    }

    buildQueryString(params) {
        return Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
    }

    // Cookie utilities
    getCookie(name) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === name) {
                return decodeURIComponent(cookieValue);
            }
        }
        return null;
    }

    setCookie(name, value, days = 7) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    }

    deleteCookie(name) {
        document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }

    // Local storage with expiration
    setLocalStorage(key, value, ttl = 3600000) {
        const item = {
            value,
            expires: Date.now() + ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    getLocalStorage(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const parsed = JSON.parse(item);
        if (parsed.expires < Date.now()) {
            localStorage.removeItem(key);
            return null;
        }
        
        return parsed.value;
    }

    // Performance measurement
    measurePerformance(fn, iterations = 1) {
        const start = performance.now();
        let result;
        
        for (let i = 0; i < iterations; i++) {
            result = fn();
        }
        
        const end = performance.now();
        const duration = end - start;
        
        return {
            result,
            duration,
            averageDuration: duration / iterations,
            iterations
        };
    }

    // Benchmark multiple functions
    benchmark(functions, iterations = 1000) {
        const results = [];
        
        for (const [name, fn] of Object.entries(functions)) {
            const measurement = this.measurePerformance(fn, iterations);
            results.push({
                name,
                ...measurement
            });
        }
        
        return results.sort((a, b) => a.averageDuration - b.averageDuration);
    }
}

export default Helpers;