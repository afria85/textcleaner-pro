/**
 * JSON Processor - JSON formatting and validation
 */

class JSONProcessor {
    constructor() {
        this.name = 'JSON Processor';
        this.description = 'Format, validate, and clean JSON data';
        this.supportedFormats = ['.json', '.jsonld', '.geojson'];
        this.defaultOptions = {
            indent: 2,
            sortKeys: false,
            removeNull: false,
            removeEmpty: false,
            validate: true,
            minify: false
        };
    }

    async process(input, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const startTime = performance.now();

        try {
            let output = input;
            let parsed;
            let isValid = false;

            // Validate JSON
            if (opts.validate) {
                try {
                    parsed = JSON.parse(input);
                    isValid = true;
                } catch (error) {
                    // Try to fix common JSON issues
                    const fixed = this.tryFixJSON(input);
                    try {
                        parsed = JSON.parse(fixed);
                        isValid = true;
                        output = fixed;
                    } catch (e) {
                        throw new Error(`Invalid JSON: ${error.message}`);
                    }
                }
            } else {
                parsed = JSON.parse(input);
                isValid = true;
            }

            // Apply transformations if we have valid JSON
            if (isValid && parsed) {
                // Remove null values if requested
                if (opts.removeNull) {
                    parsed = this.removeNullValues(parsed);
                }

                // Remove empty values if requested
                if (opts.removeEmpty) {
                    parsed = this.removeEmptyValues(parsed);
                }

                // Sort keys if requested
                if (opts.sortKeys) {
                    parsed = this.sortObjectKeys(parsed);
                }

                // Stringify with options
                if (opts.minify) {
                    output = JSON.stringify(parsed);
                } else {
                    output = JSON.stringify(parsed, null, opts.indent);
                }
            }

            const processingTime = performance.now() - startTime;

            return {
                output,
                metadata: {
                    isValid,
                    size: output.length,
                    processingTime,
                    options: opts,
                    isMinified: opts.minify,
                    indentation: opts.minify ? 0 : opts.indent
                }
            };

        } catch (error) {
            throw new Error(`JSON processing failed: ${error.message}`);
        }
    }

    tryFixJSON(jsonString) {
        let fixed = jsonString;

        // Remove trailing commas
        fixed = fixed.replace(/,\s*([\]}])/g, '$1');

        // Fix single quotes to double quotes
        fixed = fixed.replace(/'/g, '"');

        // Fix unquoted property names (with caution)
        fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

        // Remove comments (single and multi-line)
        fixed = fixed.replace(/\/\/.*$/gm, ''); // Single line
        fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line

        return fixed;
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

    removeEmptyValues(obj) {
        if (Array.isArray(obj)) {
            return obj
                .map(item => this.removeEmptyValues(item))
                .filter(item => {
                    if (item === null || item === undefined) return false;
                    if (typeof item === 'string' && item.trim() === '') return false;
                    if (typeof item === 'object' && Object.keys(item).length === 0) return false;
                    return true;
                });
        } else if (obj && typeof obj === 'object') {
            const cleaned = {};
            for (const [key, value] of Object.entries(obj)) {
                const cleanedValue = this.removeEmptyValues(value);
                if (cleanedValue !== null && 
                    cleanedValue !== undefined && 
                    !(typeof cleanedValue === 'object' && Object.keys(cleanedValue).length === 0) &&
                    !(typeof cleanedValue === 'string' && cleanedValue.trim() === '')) {
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

    validate(jsonString) {
        try {
            JSON.parse(jsonString);
            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                position: error.message.match(/position (\d+)/)?.[1] || 'unknown'
            };
        }
    }

    minify(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            return JSON.stringify(parsed);
        } catch {
            return jsonString.replace(/\s+/g, ' ').trim();
        }
    }

    prettify(jsonString, indent = 2) {
        try {
            const parsed = JSON.parse(jsonString);
            return JSON.stringify(parsed, null, indent);
        } catch (error) {
            // Try to fix and prettify
            const fixed = this.tryFixJSON(jsonString);
            try {
                const parsed = JSON.parse(fixed);
                return JSON.stringify(parsed, null, indent);
            } catch {
                return jsonString;
            }
        }
    }
}

export default JSONProcessor;