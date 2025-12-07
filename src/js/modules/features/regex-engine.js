/**
 * Regex Engine - Advanced regex tools and utilities
 */

class RegexEngine {
    constructor() {
        this.history = [];
        this.maxHistorySize = 50;
        this.commonPatterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
            url: /https?:\/\/[^\s]+/,
            phone: /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/,
            ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
            date: /\b\d{4}-\d{2}-\d{2}\b/,
            time: /\b\d{2}:\d{2}(:\d{2})?\b/,
            hexColor: /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/,
            creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/
        };
    }

    test(pattern, text, flags = '') {
        try {
            const regex = new RegExp(pattern, flags);
            const matches = text.match(regex);
            
            return {
                valid: true,
                matches: matches || [],
                matchCount: matches ? matches.length : 0,
                testResult: regex.test(text)
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    replace(pattern, text, replacement, flags = 'g') {
        try {
            const regex = new RegExp(pattern, flags);
            const result = text.replace(regex, replacement);
            const matchCount = (text.match(regex) || []).length;
            
            this.addToHistory({
                type: 'replace',
                pattern,
                flags,
                replacement,
                matchCount,
                timestamp: Date.now()
            });
            
            return {
                success: true,
                result,
                matchCount,
                originalLength: text.length,
                resultLength: result.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    extract(pattern, text, flags = 'g') {
        try {
            const regex = new RegExp(pattern, flags);
            const matches = [...text.matchAll(regex)];
            
            const extracted = matches.map(match => ({
                fullMatch: match[0],
                groups: match.slice(1),
                index: match.index,
                input: match.input
            }));
            
            this.addToHistory({
                type: 'extract',
                pattern,
                flags,
                matchCount: extracted.length,
                timestamp: Date.now()
            });
            
            return {
                success: true,
                matches: extracted,
                matchCount: extracted.length,
                uniqueMatches: [...new Set(extracted.map(m => m.fullMatch))]
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    validate(pattern) {
        try {
            new RegExp(pattern);
            return {
                valid: true,
                message: 'Valid regular expression'
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                suggestion: this.getSuggestion(error.message, pattern)
            };
        }
    }

    getSuggestion(error, pattern) {
        if (error.includes('Unterminated')) {
            return 'Check for missing closing delimiter or bracket';
        } else if (error.includes('Invalid group')) {
            return 'Check group syntax (e.g., (?=), (?:), (?<=))';
        } else if (error.includes('Invalid escape')) {
            return 'Check escape sequences (e.g., \\d, \\w, \\s)';
        }
        return 'Review regex syntax and special characters';
    }

    explain(pattern) {
        const explanations = [];
        let i = 0;
        
        while (i < pattern.length) {
            const char = pattern[i];
            
            switch (char) {
                case '\\':
                    const nextChar = pattern[i + 1];
                    explanations.push(this.explainEscapeSequence(nextChar));
                    i += 2;
                    break;
                    
                case '[':
                    const closingBracket = pattern.indexOf(']', i);
                    if (closingBracket !== -1) {
                        const charClass = pattern.substring(i, closingBracket + 1);
                        explanations.push(`Character class: ${charClass}`);
                        i = closingBracket + 1;
                    } else {
                        explanations.push('Literal: [');
                        i++;
                    }
                    break;
                    
                case '(':
                    const type = this.getGroupType(pattern, i);
                    explanations.push(`Group: ${type}`);
                    i += type.length;
                    break;
                    
                case '{':
                    const closingBrace = pattern.indexOf('}', i);
                    if (closingBrace !== -1) {
                        const quantifier = pattern.substring(i, closingBrace + 1);
                        explanations.push(`Quantifier: ${quantifier}`);
                        i = closingBrace + 1;
                    } else {
                        explanations.push('Literal: {');
                        i++;
                    }
                    break;
                    
                default:
                    if ('*+?'.includes(char)) {
                        explanations.push(`Quantifier: ${char}`);
                    } else if ('^$'.includes(char)) {
                        explanations.push(`Anchor: ${char === '^' ? 'Start of line' : 'End of line'}`);
                    } else if ('.|'.includes(char)) {
                        explanations.push(char === '.' ? 'Any character' : 'Alternation');
                    } else {
                        explanations.push(`Literal: ${char}`);
                    }
                    i++;
            }
        }
        
        return explanations;
    }

    explainEscapeSequence(char) {
        const sequences = {
            d: 'Digit (0-9)',
            D: 'Non-digit',
            w: 'Word character (a-z, A-Z, 0-9, _)',
            W: 'Non-word character',
            s: 'Whitespace',
            S: 'Non-whitespace',
            b: 'Word boundary',
            B: 'Non-word boundary',
            n: 'New line',
            r: 'Carriage return',
            t: 'Tab',
            '\\': 'Backslash'
        };
        
        return sequences[char] || `Escape sequence: \\${char}`;
    }

    getGroupType(pattern, start) {
        if (pattern[start + 1] === '?') {
            const nextChar = pattern[start + 2];
            switch (nextChar) {
                case ':': return 'Non-capturing group';
                case '=': return 'Positive lookahead';
                case '!': return 'Negative lookahead';
                case '<':
                    const charAfter = pattern[start + 3];
                    if (charAfter === '=') return 'Positive lookbehind';
                    if (charAfter === '!') return 'Negative lookbehind';
                    return 'Named capturing group';
                default: return 'Extended syntax group';
            }
        }
        return 'Capturing group';
    }

    generate(patternType, options = {}) {
        const generators = {
            email: () => this.generateEmail(options),
            phone: () => this.generatePhone(options),
            date: () => this.generateDate(options),
            password: () => this.generatePassword(options),
            username: () => this.generateUsername(options)
        };
        
        const generator = generators[patternType];
        if (!generator) {
            throw new Error(`Unknown pattern type: ${patternType}`);
        }
        
        return generator();
    }

    generateEmail(options = {}) {
        const domains = options.domains || ['gmail.com', 'yahoo.com', 'outlook.com'];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const username = Math.random().toString(36).substring(2, 10);
        return `${username}@${domain}`;
    }

    generatePhone(options = {}) {
        const format = options.format || '(###) ###-####';
        return format.replace(/#/g, () => Math.floor(Math.random() * 10));
    }

    generateDate(options = {}) {
        const year = options.year || 2024;
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    generatePassword(options = {}) {
        const length = options.length || 12;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    generateUsername(options = {}) {
        const adjectives = ['cool', 'happy', 'fast', 'smart', 'brave'];
        const nouns = ['tiger', 'eagle', 'wolf', 'dragon', 'phoenix'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 1000);
        return `${adj}_${noun}${num}`;
    }

    addToHistory(entry) {
        this.history.unshift(entry);
        if (this.history.length > this.maxHistorySize) {
            this.history.pop();
        }
    }

    getHistory() {
        return [...this.history];
    }

    clearHistory() {
        this.history = [];
    }

    getCommonPattern(name) {
        return this.commonPatterns[name] || null;
    }

    listCommonPatterns() {
        return Object.keys(this.commonPatterns).map(name => ({
            name,
            pattern: this.commonPatterns[name].toString(),
            description: this.getPatternDescription(name)
        }));
    }

    getPatternDescription(name) {
        const descriptions = {
            email: 'Matches email addresses',
            url: 'Matches URLs (http/https)',
            phone: 'Matches phone numbers',
            ipv4: 'Matches IPv4 addresses',
            date: 'Matches dates in YYYY-MM-DD format',
            time: 'Matches time in HH:MM or HH:MM:SS format',
            hexColor: 'Matches hex color codes',
            creditCard: 'Matches credit card numbers'
        };
        return descriptions[name] || 'No description available';
    }
}

export default RegexEngine;