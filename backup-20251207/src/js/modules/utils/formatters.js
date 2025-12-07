/**
 * Formatters - Text and data formatting utilities
 */

class Formatters {
    constructor() {
        // Number formatters cache
        this.numberFormatters = new Map();
        this.dateFormatters = new Map();
        this.currencyFormatters = new Map();
    }

    // Number formatting
    formatNumber(number, options = {}) {
        const {
            locale = 'en-US',
            minimumFractionDigits = 0,
            maximumFractionDigits = 2,
            useGrouping = true,
            notation = 'standard',
            style = 'decimal'
        } = options;

        const key = `${locale}_${minimumFractionDigits}_${maximumFractionDigits}_${useGrouping}_${notation}_${style}`;
        
        if (!this.numberFormatters.has(key)) {
            this.numberFormatters.set(key, new Intl.NumberFormat(locale, {
                style,
                minimumFractionDigits,
                maximumFractionDigits,
                useGrouping,
                notation
            }));
        }
        
        return this.numberFormatters.get(key).format(number);
    }

    // Currency formatting
    formatCurrency(amount, currency = 'USD', options = {}) {
        const {
            locale = 'en-US',
            minimumFractionDigits = 2,
            maximumFractionDigits = 2,
            useGrouping = true
        } = options;

        const key = `${locale}_${currency}_${minimumFractionDigits}_${maximumFractionDigits}_${useGrouping}`;
        
        if (!this.currencyFormatters.has(key)) {
            this.currencyFormatters.set(key, new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
                minimumFractionDigits,
                maximumFractionDigits,
                useGrouping
            }));
        }
        
        return this.currencyFormatters.get(key).format(amount);
    }

    // Percentage formatting
    formatPercent(number, options = {}) {
        return this.formatNumber(number * 100, {
            style: 'percent',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            ...options
        });
    }

    // Date/time formatting
    formatDate(date, format = 'medium', locale = 'en-US') {
        const dateObj = new Date(date);
        const key = `${locale}_${format}`;
        
        if (!this.dateFormatters.has(key)) {
            const options = this.getDateFormatOptions(format);
            this.dateFormatters.set(key, new Intl.DateTimeFormat(locale, options));
        }
        
        return this.dateFormatters.get(key).format(dateObj);
    }

    getDateFormatOptions(format) {
        const presets = {
            short: {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            },
            medium: {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            },
            long: {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            },
            full: {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            },
            time: {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            },
            datetime: {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            }
        };
        
        return presets[format] || presets.medium;
    }

    // Relative time formatting
    formatRelativeTime(date, locale = 'en-US') {
        const now = new Date();
        const diff = now - new Date(date);
        
        const units = [
            { unit: 'year', ms: 31536000000 },
            { unit: 'month', ms: 2628000000 },
            { unit: 'week', ms: 604800000 },
            { unit: 'day', ms: 86400000 },
            { unit: 'hour', ms: 3600000 },
            { unit: 'minute', ms: 60000 },
            { unit: 'second', ms: 1000 }
        ];
        
        for (const { unit, ms } of units) {
            const value = Math.round(diff / ms);
            if (Math.abs(value) >= 1) {
                const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
                return rtf.format(-value, unit);
            }
        }
        
        return 'just now';
    }

    // File size formatting
    formatFileSize(bytes, options = {}) {
        const {
            decimals = 2,
            binary = false,
            unit = 'auto'
        } = options;
        
        if (unit !== 'auto') {
            const units = binary 
                ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
                : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
            
            const unitIndex = units.indexOf(unit);
            if (unitIndex !== -1) {
                const divisor = binary ? 1024 : 1000;
                const size = bytes / Math.pow(divisor, unitIndex);
                return `${size.toFixed(decimals)} ${unit}`;
            }
        }
        
        // Auto-detect unit
        const thresh = binary ? 1024 : 1000;
        
        if (Math.abs(bytes) < thresh) {
            return `${bytes} B`;
        }
        
        const units = binary
            ? ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
            : ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        
        let u = -1;
        let r = Math.pow(10, decimals);
        
        do {
            bytes /= thresh;
            ++u;
        } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
        
        return `${bytes.toFixed(decimals)} ${units[u]}`;
    }

    // Duration formatting
    formatDuration(seconds, options = {}) {
        const {
            format = 'auto',
            showDays = true,
            showHours = true,
            showMinutes = true,
            showSeconds = true,
            padZeros = false
        } = options;
        
        if (format === 'iso') {
            return this.formatISODuration(seconds);
        }
        
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        const parts = [];
        
        if (showDays && days > 0) {
            parts.push(padZeros ? String(days).padStart(2, '0') : days);
            parts.push('d');
        }
        
        if (showHours && (hours > 0 || days > 0)) {
            parts.push(padZeros ? String(hours).padStart(2, '0') : hours);
            parts.push('h');
        }
        
        if (showMinutes && (minutes > 0 || hours > 0 || days > 0)) {
            parts.push(padZeros ? String(minutes).padStart(2, '0') : minutes);
            parts.push('m');
        }
        
        if (showSeconds) {
            parts.push(padZeros ? String(secs).padStart(2, '0') : secs);
            parts.push('s');
        }
        
        return parts.join(' ');
    }

    formatISODuration(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        const parts = ['P'];
        
        if (days > 0) {
            parts.push(`${days}D`);
        }
        
        if (hours > 0 || minutes > 0 || secs > 0) {
            parts.push('T');
            if (hours > 0) parts.push(`${hours}H`);
            if (minutes > 0) parts.push(`${minutes}M`);
            if (secs > 0) parts.push(`${secs}S`);
        }
        
        return parts.join('');
    }

    // Text formatting
    formatText(text, options = {}) {
        let formatted = text;
        
        if (options.case === 'upper') {
            formatted = formatted.toUpperCase();
        } else if (options.case === 'lower') {
            formatted = formatted.toLowerCase();
        } else if (options.case === 'title') {
            formatted = this.toTitleCase(formatted);
        } else if (options.case === 'sentence') {
            formatted = this.toSentenceCase(formatted);
        }
        
        if (options.trim) {
            formatted = formatted.trim();
        }
        
        if (options.removeExtraSpaces) {
            formatted = formatted.replace(/\s+/g, ' ');
        }
        
        if (options.removeLineBreaks) {
            formatted = formatted.replace(/\n/g, ' ');
        }
        
        if (options.escapeHtml) {
            formatted = this.escapeHtml(formatted);
        }
        
        if (options.unescapeHtml) {
            formatted = this.unescapeHtml(formatted);
        }
        
        return formatted;
    }

    toTitleCase(text) {
        return text.replace(/\w\S*/g, (word) => {
            return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
        });
    }

    toSentenceCase(text) {
        return text.replace(/(^\w|\.\s+\w)/g, (match) => match.toUpperCase());
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    unescapeHtml(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    // Phone number formatting
    formatPhoneNumber(phoneNumber, format = 'us') {
        const clean = phoneNumber.replace(/\D/g, '');
        
        switch (format.toLowerCase()) {
            case 'us':
                if (clean.length === 10) {
                    return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
                } else if (clean.length === 11 && clean.startsWith('1')) {
                    return `+1 (${clean.slice(1, 4)}) ${clean.slice(4, 7)}-${clean.slice(7)}`;
                }
                break;
                
            case 'international':
                if (clean.length <= 3) return `+${clean}`;
                if (clean.length <= 6) return `+${clean.slice(0, 3)} ${clean.slice(3)}`;
                if (clean.length <= 10) return `+${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
                return `+${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 10)} ${clean.slice(10)}`;
                
            case 'e164':
                return `+${clean}`;
                
            case 'dots':
                return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1.$2.$3');
        }
        
        return phoneNumber;
    }

    // Credit card formatting
    formatCreditCard(number, type = 'auto') {
        const clean = number.replace(/\D/g, '');
        
        if (type === 'auto') {
            type = this.detectCreditCardType(clean);
        }
        
        switch (type) {
            case 'amex':
                return clean.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
            default:
                return clean.replace(/(\d{4})/g, '$1 ').trim();
        }
    }

    detectCreditCardType(number) {
        const patterns = {
            visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
            mastercard: /^5[1-5][0-9]{14}$/,
            amex: /^3[47][0-9]{13}$/,
            discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
            diners: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
            jcb: /^(?:2131|1800|35\d{3})\d{11}$/
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(number)) {
                return type;
            }
        }
        
        return 'unknown';
    }

    // Social security number formatting
    formatSSN(ssn) {
        const clean = ssn.replace(/\D/g, '');
        if (clean.length === 9) {
            return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5)}`;
        }
        return ssn;
    }

    // URL formatting
    formatUrl(url, options = {}) {
        let formatted = url.trim();
        
        if (options.ensureProtocol && !formatted.match(/^https?:\/\//)) {
            formatted = `https://${formatted}`;
        }
        
        if (options.removeTrailingSlash) {
            formatted = formatted.replace(/\/+$/, '');
        }
        
        if (options.encode) {
            formatted = encodeURI(formatted);
        }
        
        return formatted;
    }

    // Email formatting
    formatEmail(email, options = {}) {
        let formatted = email.trim().toLowerCase();
        
        if (options.removeDots) {
            const [local, domain] = formatted.split('@');
            formatted = `${local.replace(/\./g, '')}@${domain}`;
        }
        
        if (options.removePlus) {
            const [local, domain] = formatted.split('@');
            formatted = `${local.split('+')[0]}@${domain}`;
        }
        
        return formatted;
    }

    // JSON formatting
    formatJSON(json, options = {}) {
        const { indent = 2, sortKeys = false, removeNull = false } = options;
        
        try {
            let parsed = typeof json === 'string' ? JSON.parse(json) : json;
            
            if (removeNull) {
                parsed = this.removeNullValues(parsed);
            }
            
            if (sortKeys) {
                parsed = this.sortObjectKeys(parsed);
            }
            
            return JSON.stringify(parsed, null, indent);
        } catch {
            return json;
        }
    }

    removeNullValues(obj) {
        if (Array.isArray(obj)) {
            return obj
                .map(item => this.removeNullValues(item))
                .filter(item => item !== null);
        } else if (obj && typeof obj === 'object') {
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
        } else if (obj && typeof obj === 'object') {
            const sorted = {};
            Object.keys(obj).sort().forEach(key => {
                sorted[key] = this.sortObjectKeys(obj[key]);
            });
            return sorted;
        }
        return obj;
    }

    // CSV formatting
    formatCSV(data, options = {}) {
        const {
            delimiter = ',',
            headers = true,
            quoteStrings = true
        } = options;
        
        if (Array.isArray(data)) {
            if (data.length === 0) return '';
            
            const isArrayOfObjects = typeof data[0] === 'object';
            const rows = [];
            
            if (headers && isArrayOfObjects) {
                const headerRow = Object.keys(data[0]);
                rows.push(this.formatCSVRow(headerRow, delimiter, quoteStrings));
            }
            
            for (const row of data) {
                const values = isArrayOfObjects ? Object.values(row) : [row];
                rows.push(this.formatCSVRow(values, delimiter, quoteStrings));
            }
            
            return rows.join('\n');
        }
        
        return data;
    }

    formatCSVRow(values, delimiter, quoteStrings) {
        return values.map(value => {
            let str = String(value);
            
            if (quoteStrings) {
                str = str.replace(/"/g, '""');
                if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
                    str = `"${str}"`;
                }
            }
            
            return str;
        }).join(delimiter);
    }

    // Markdown formatting helpers
    formatMarkdown(text, options = {}) {
        let formatted = text;
        
        if (options.bold) {
            formatted = `**${formatted}**`;
        }
        
        if (options.italic) {
            formatted = `*${formatted}*`;
        }
        
        if (options.code) {
            formatted = options.block ? `\`\`\`\n${formatted}\n\`\`\`` : `\`${formatted}\``;
        }
        
        if (options.link) {
            formatted = `[${formatted}](${options.link})`;
        }
        
        if (options.heading) {
            formatted = `${'#'.repeat(options.heading)} ${formatted}`;
        }
        
        return formatted;
    }

    // Template string formatting
    formatTemplate(template, data) {
        return template.replace(/\{([^}]+)\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    }

    // Slug generation
    formatSlug(text, options = {}) {
        const {
            separator = '-',
            lowerCase = true,
            maxLength = 50
        } = options;
        
        let slug = text
            .normalize('NFD') // Normalize diacritics
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^\w\s-]/g, '') // Remove non-word chars
            .replace(/\s+/g, separator) // Replace spaces with separator
            .replace(new RegExp(`${separator}+`, 'g'), separator); // Remove duplicate separators
        
        if (lowerCase) {
            slug = slug.toLowerCase();
        }
        
        if (maxLength && slug.length > maxLength) {
            slug = slug.substring(0, maxLength);
            // Don't end with separator
            if (slug.endsWith(separator)) {
                slug = slug.substring(0, slug.length - 1);
            }
        }
        
        return slug;
    }

    // Initials from name
    formatInitials(name, options = {}) {
        const {
            maxLength = 2,
            separator = '',
            uppercase = true
        } = options;
        
        const parts = name.split(/\s+/);
        let initials = parts.map(part => part.charAt(0)).join(separator);
        
        if (maxLength && initials.length > maxLength) {
            initials = initials.substring(0, maxLength);
        }
        
        if (uppercase) {
            initials = initials.toUpperCase();
        }
        
        return initials;
    }

    // Mask sensitive data
    formatMask(text, options = {}) {
        const {
            start = 0,
            end = 4,
            maskChar = '*',
            preserveLength = true
        } = options;
        
        if (text.length <= start + end) {
            return maskChar.repeat(text.length);
        }
        
        const visibleStart = text.substring(0, start);
        const visibleEnd = text.substring(text.length - end);
        const maskedMiddle = preserveLength 
            ? maskChar.repeat(text.length - start - end)
            : maskChar.repeat(4);
        
        return visibleStart + maskedMiddle + visibleEnd;
    }
}

export default Formatters;