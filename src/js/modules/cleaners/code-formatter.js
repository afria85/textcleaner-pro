/**
 * Code Formatter - Format and clean code
 */

class CodeFormatter {
    constructor() {
        this.name = 'Code Formatter';
        this.description = 'Format and clean code in various programming languages';
        this.supportedFormats = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.html', '.css', '.php', '.json', '.xml'];
        this.defaultOptions = {
            indentSize: 2,
            useTabs: false,
            trimTrailingWhitespace: true,
            insertFinalNewline: true,
            normalizeLineEndings: true,
            language: 'auto',
            preserveComments: true,
            maxLineLength: 80
        };

        // Language-specific configurations
        this.languageConfigs = {
            javascript: {
                indent: 2,
                semicolons: true,
                quoteStyle: 'single'
            },
            python: {
                indent: 4,
                useTabs: false,
                maxLineLength: 79
            },
            html: {
                indent: 2,
                quoteStyle: 'double',
                selfClosingTags: true
            },
            css: {
                indent: 2,
                braceStyle: 'expanded'
            }
        };
    }

    async process(input, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const startTime = performance.now();

        try {
            let output = input;
            const language = opts.language === 'auto' ? this.detectLanguage(input) : opts.language;
            const langConfig = this.languageConfigs[language] || {};

            // Normalize line endings
            if (opts.normalizeLineEndings) {
                output = output.replace(/\r\n|\r/g, '\n');
            }

            // Trim trailing whitespace
            if (opts.trimTrailingWhitespace) {
                output = output.replace(/[ \t]+$/gm, '');
            }

            // Apply indentation
            if (opts.useTabs) {
                output = this.convertSpacesToTabs(output, opts.indentSize);
            } else {
                output = this.convertTabsToSpaces(output, opts.indentSize);
            }

            // Language-specific formatting
            if (language && this[`format${this.capitalize(language)}`]) {
                output = await this[`format${this.capitalize(language)}`](output, { ...langConfig, ...opts });
            }

            // Apply max line length
            if (opts.maxLineLength > 0) {
                output = this.wrapCode(output, opts.maxLineLength, language);
            }

            // Insert final newline
            if (opts.insertFinalNewline && !output.endsWith('\n')) {
                output += '\n';
            }

            const processingTime = performance.now() - startTime;

            // Calculate statistics
            const lines = output.split('\n').length;
            const characters = output.length;
            const indentationChar = opts.useTabs ? 'tabs' : 'spaces';
            const indentationSize = opts.useTabs ? 1 : opts.indentSize;

            return {
                output,
                metadata: {
                    language,
                    lines,
                    characters,
                    processingTime,
                    indentation: `${indentationSize} ${indentationChar}`,
                    options: opts
                }
            };

        } catch (error) {
            throw new Error(`Code formatting failed: ${error.message}`);
        }
    }

    detectLanguage(code) {
        // Simple language detection based on file patterns
        if (code.includes('<?php')) return 'php';
        if (code.includes('<html') || code.includes('<!DOCTYPE')) return 'html';
        if (code.includes('import React') || code.includes('function Component')) return 'javascript';
        if (code.match(/def\s+\w+\(|class\s+\w+:/)) return 'python';
        if (code.match(/public\s+class|\/\/ Java/)) return 'java';
        if (code.match(/#include|int main\(\)/)) return 'cpp';
        if (code.match(/\.selector\s*{/)) return 'css';
        
        // Check for JSON
        try {
            JSON.parse(code);
            return 'json';
        } catch {}
        
        return 'plain';
    }

    convertSpacesToTabs(code, spacesPerTab = 4) {
        const spaces = ' '.repeat(spacesPerTab);
        return code.replace(new RegExp(spaces, 'g'), '\t');
    }

    convertTabsToSpaces(code, spacesPerTab = 4) {
        const spaces = ' '.repeat(spacesPerTab);
        return code.replace(/\t/g, spaces);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Language-specific formatters
    async formatJavascript(code, options) {
        // Basic JavaScript formatting
        let formatted = code;
        
        // Add/remove semicolons based on preference
        if (options.semicolons === false) {
            // Remove trailing semicolons (basic)
            formatted = formatted.replace(/;\s*$/gm, '');
        }
        
        // Normalize quotes
        if (options.quoteStyle === 'single') {
            formatted = formatted.replace(/"([^"]*)"/g, "'$1'");
        } else if (options.quoteStyle === 'double') {
            formatted = formatted.replace(/'([^']*)'/g, "\"$1\"");
        }
        
        return formatted;
    }

    async formatPython(code, options) {
        // Basic Python formatting
        let formatted = code;
        
        // Ensure consistent indentation
        const lines = formatted.split('\n');
        const reformattedLines = lines.map(line => {
            // Count leading spaces
            const leadingSpaces = line.match(/^ */)[0].length;
            const expectedIndent = Math.floor(leadingSpaces / options.indent) * options.indent;
            return ' '.repeat(expectedIndent) + line.trimStart();
        });
        
        return reformattedLines.join('\n');
    }

    async formatHtml(code, options) {
        // Basic HTML formatting
        let formatted = code;
        
        // Normalize self-closing tags
        if (options.selfClosingTags) {
            formatted = formatted.replace(/<(\w+)([^>]*)\s*>\s*<\/\1>/g, '<$1$2 />');
        }
        
        // Normalize quotes
        if (options.quoteStyle === 'single') {
            formatted = formatted.replace(/="([^"]*)"/g, "='$1'");
        }
        
        return formatted;
    }

    wrapCode(code, maxLength, language) {
        const lines = code.split('\n');
        const wrappedLines = [];
        
        for (const line of lines) {
            if (line.length <= maxLength) {
                wrappedLines.push(line);
                continue;
            }
            
            // Try to break at logical points
            const breakPoints = this.getBreakPoints(line, language);
            let currentLine = line;
            
            while (currentLine.length > maxLength) {
                let breakAt = -1;
                
                for (const point of breakPoints) {
                    if (point < maxLength && point > breakAt) {
                        breakAt = point;
                    }
                }
                
                if (breakAt === -1) {
                    // Force break at maxLength
                    breakAt = maxLength;
                }
                
                wrappedLines.push(currentLine.substring(0, breakAt).trimEnd());
                currentLine = currentLine.substring(breakAt).trimStart();
            }
            
            if (currentLine) {
                wrappedLines.push(currentLine);
            }
        }
        
        return wrappedLines.join('\n');
    }

    getBreakPoints(line, language) {
        const points = [];
        
        // Common break points for all languages
        if (line.includes(',')) {
            const commas = line.split('').map((char, idx) => char === ',' ? idx : -1).filter(idx => idx !== -1);
            points.push(...commas);
        }
        
        if (line.includes(' ')) {
            const spaces = line.split('').map((char, idx) => char === ' ' ? idx : -1).filter(idx => idx !== -1);
            points.push(...spaces);
        }
        
        // Language-specific break points
        switch (language) {
            case 'javascript':
            case 'python':
                if (line.includes('(')) points.push(line.indexOf('('));
                if (line.includes(')')) points.push(line.indexOf(')'));
                if (line.includes('=')) points.push(line.indexOf('='));
                break;
            case 'html':
                if (line.includes('>')) points.push(line.indexOf('>'));
                if (line.includes('<')) points.push(line.indexOf('<'));
                break;
        }
        
        return points;
    }

    // Utility methods
    minify(code, language) {
        switch (language) {
            case 'javascript':
                return code.replace(/\s+/g, ' ').trim();
            case 'html':
                return code.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
            case 'css':
                return code.replace(/\s+/g, ' ').replace(/;\s*/g, ';').trim();
            default:
                return code.replace(/\s+/g, ' ').trim();
        }
    }

    beautify(code, language, options = {}) {
        // This would typically use a proper beautifier library
        // For now, implement basic beautification
        return this.process(code, {
            language,
            indentSize: options.indentSize || 2,
            useTabs: options.useTabs || false,
            maxLineLength: options.maxLineLength || 80
        }).then(result => result.output);
    }
}

export default CodeFormatter;