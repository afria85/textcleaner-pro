/**
 * Data Anonymizer - Remove or anonymize sensitive information
 */

class DataAnonymizer {
    constructor() {
        this.patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g,
            ssn: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
            creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
            ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
            ipv6: /([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/g,
            macAddress: /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g,
            bitcoin: /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g,
            ethereum: /0x[a-fA-F0-9]{40}/g,
            url: /https?:\/\/[^\s]+/g,
            username: /@\w+/g,
            hashtag: /#\w+/g
        };

        this.replacementStrategies = {
            mask: this.maskStrategy,
            hash: this.hashStrategy,
            replace: this.replaceStrategy,
            remove: this.removeStrategy
        };
    }

    async anonymize(text, options = {}) {
        const startTime = performance.now();
        const opts = {
            patterns: options.patterns || Object.keys(this.patterns),
            strategy: options.strategy || 'mask',
            customReplacements: options.customReplacements || {},
            preserveFormat: options.preserveFormat !== false,
            caseSensitive: options.caseSensitive || false
        };

        try {
            let result = text;
            const replacements = [];

            // Process each selected pattern
            for (const patternName of opts.patterns) {
                const pattern = this.patterns[patternName];
                if (!pattern) continue;

                const strategy = opts.customReplacements[patternName]?.strategy || opts.strategy;
                const customReplacement = opts.customReplacements[patternName]?.replacement;
                
                const matches = [...result.matchAll(pattern)];
                
                for (const match of matches) {
                    const original = match[0];
                    const replacement = this.getReplacement(original, patternName, strategy, customReplacement, opts);
                    
                    // Replace only this specific occurrence
                    result = result.replace(original, replacement);
                    
                    replacements.push({
                        pattern: patternName,
                        original,
                        replacement,
                        strategy,
                        position: match.index
                    });
                }
            }

            const processingTime = performance.now() - startTime;

            return {
                anonymizedText: result,
                metadata: {
                    originalLength: text.length,
                    anonymizedLength: result.length,
                    processingTime,
                    replacementsCount: replacements.length,
                    patternsUsed: opts.patterns,
                    strategy: opts.strategy,
                    replacements: replacements
                }
            };

        } catch (error) {
            throw new Error(`Data anonymization failed: ${error.message}`);
        }
    }

    getReplacement(original, patternName, strategy, customReplacement, options) {
        if (customReplacement !== undefined) {
            return customReplacement;
        }

        const strategyFunc = this.replacementStrategies[strategy];
        if (strategyFunc) {
            return strategyFunc.call(this, original, patternName, options);
        }

        // Default to mask strategy
        return this.maskStrategy(original, patternName, options);
    }

    maskStrategy(original, patternName, options) {
        const length = original.length;
        
        switch (patternName) {
            case 'email':
                const [localPart, domain] = original.split('@');
                const maskedLocal = localPart.charAt(0) + '*'.repeat(Math.max(0, localPart.length - 2)) + (localPart.length > 1 ? localPart.charAt(localPart.length - 1) : '');
                return `${maskedLocal}@${domain}`;
                
            case 'phone':
                // Keep country code and last 4 digits
                const digits = original.replace(/\D/g, '');
                if (digits.length <= 4) return '*'.repeat(length);
                const visible = digits.slice(-4);
                return `***-***-${visible}`;
                
            case 'ssn':
                return '***-**-' + original.slice(-4);
                
            case 'creditCard':
                const cardDigits = original.replace(/\D/g, '');
                if (cardDigits.length !== 16) return '*'.repeat(length);
                return '****-****-****-' + cardDigits.slice(-4);
                
            default:
                if (options.preserveFormat) {
                    return original.replace(/[a-zA-Z0-9]/g, '*');
                }
                return '*'.repeat(length);
        }
    }

    hashStrategy(original, patternName, options) {
        // Simple hash function for demonstration
        let hash = 0;
        for (let i = 0; i < original.length; i++) {
            hash = ((hash << 5) - hash) + original.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        
        const prefix = patternName.charAt(0).toUpperCase();
        return `${prefix}_${Math.abs(hash).toString(16).slice(0, 8)}`;
    }

    replaceStrategy(original, patternName, options) {
        const replacements = {
            email: `user${Math.floor(Math.random() * 10000)}@example.com`,
            phone: `+1-${this.generateRandomNumber(3)}-${this.generateRandomNumber(3)}-${this.generateRandomNumber(4)}`,
            ssn: `${this.generateRandomNumber(3)}-${this.generateRandomNumber(2)}-${this.generateRandomNumber(4)}`,
            creditCard: `${this.generateRandomNumber(4)}-${this.generateRandomNumber(4)}-${this.generateRandomNumber(4)}-${this.generateRandomNumber(4)}`,
            ipv4: `${this.generateRandomNumber(3)}.${this.generateRandomNumber(3)}.${this.generateRandomNumber(3)}.${this.generateRandomNumber(3)}`
        };
        
        return replacements[patternName] || `[ANONYMIZED_${patternName.toUpperCase()}]`;
    }

    removeStrategy(original, patternName, options) {
        return '';
    }

    generateRandomNumber(digits) {
        const min = Math.pow(10, digits - 1);
        const max = Math.pow(10, digits) - 1;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    detectSensitiveData(text, patterns = null) {
        const patternsToCheck = patterns || Object.keys(this.patterns);
        const detected = {};
        let totalCount = 0;

        for (const patternName of patternsToCheck) {
            const pattern = this.patterns[patternName];
            if (!pattern) continue;

            const matches = text.match(pattern);
            if (matches) {
                detected[patternName] = {
                    count: matches.length,
                    examples: matches.slice(0, 3), // Show first 3 examples
                    pattern: pattern.toString()
                };
                totalCount += matches.length;
            }
        }

        return {
            detected,
            totalCount,
            hasSensitiveData: totalCount > 0,
            riskLevel: this.calculateRiskLevel(detected)
        };
    }

    calculateRiskLevel(detectedData) {
        const highRisk = ['ssn', 'creditCard'];
        const mediumRisk = ['email', 'phone', 'ipv4', 'ipv6'];
        
        let score = 0;
        
        for (const [type, data] of Object.entries(detectedData)) {
            if (highRisk.includes(type)) {
                score += data.count * 3;
            } else if (mediumRisk.includes(type)) {
                score += data.count * 2;
            } else {
                score += data.count;
            }
        }
        
        if (score >= 10) return 'HIGH';
        if (score >= 5) return 'MEDIUM';
        if (score >= 1) return 'LOW';
        return 'NONE';
    }

    addCustomPattern(name, pattern, description = '') {
        if (name in this.patterns) {
            console.warn(`Pattern "${name}" already exists, overwriting`);
        }
        
        try {
            const regex = new RegExp(pattern, 'g');
            this.patterns[name] = regex;
            
            return {
                success: true,
                name,
                pattern: regex.toString(),
                description
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    removePattern(name) {
        if (this.patterns[name]) {
            delete this.patterns[name];
            return { success: true, message: `Pattern "${name}" removed` };
        }
        return { success: false, error: `Pattern "${name}" not found` };
    }

    listPatterns() {
        return Object.entries(this.patterns).map(([name, pattern]) => ({
            name,
            pattern: pattern.toString(),
            description: this.getPatternDescription(name)
        }));
    }

    getPatternDescription(name) {
        const descriptions = {
            email: 'Email addresses',
            phone: 'Phone numbers',
            ssn: 'Social Security Numbers',
            creditCard: 'Credit card numbers',
            ipv4: 'IPv4 addresses',
            ipv6: 'IPv6 addresses',
            macAddress: 'MAC addresses',
            bitcoin: 'Bitcoin addresses',
            ethereum: 'Ethereum addresses',
            url: 'URLs',
            username: 'Social media usernames',
            hashtag: 'Hashtags'
        };
        
        return descriptions[name] || 'Custom pattern';
    }
}

export default DataAnonymizer;