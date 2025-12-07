/**
 * Text Formatter - General text cleaning and formatting
 */

class TextFormatter {
    constructor() {
        this.name = 'Text Formatter';
        this.description = 'General text cleaning and formatting tools';
        this.supportedFormats = ['.txt', '.md', '.log', '.rtf'];
        this.defaultOptions = {
            trim: true,
            removeExtraSpaces: true,
            removeEmptyLines: true,
            normalizeLineEndings: true,
            lineEnding: '\n',
            toLowerCase: false,
            toUpperCase: false,
            capitalize: false,
            removeNumbers: false,
            removePunctuation: false,
            removeSpecialChars: false,
            maxLineLength: 0, // 0 means no limit
            indentSize: 0,
            encoding: 'utf-8'
        };
    }

    async process(input, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const startTime = performance.now();

        try {
            let output = input;

            // Normalize line endings first
            if (opts.normalizeLineEndings) {
                output = output.replace(/\r\n|\r/g, '\n');
                if (opts.lineEnding !== '\n') {
                    output = output.replace(/\n/g, opts.lineEnding);
                }
            }

            // Trim whitespace
            if (opts.trim) {
                output = output.trim();
            }

            // Remove extra spaces
            if (opts.removeExtraSpaces) {
                // Remove multiple spaces
                output = output.replace(/[ \t]+/g, ' ');
                // Remove spaces at start/end of lines
                output = output.replace(/^[ \t]+/gm, '').replace(/[ \t]+$/gm, '');
            }

            // Remove empty lines
            if (opts.removeEmptyLines) {
                output = output.replace(/^\s*[\r\n]/gm, '');
            }

            // Case transformations
            if (opts.toLowerCase) {
                output = output.toLowerCase();
            } else if (opts.toUpperCase) {
                output = output.toUpperCase();
            } else if (opts.capitalize) {
                output = this.capitalizeText(output);
            }

            // Remove numbers
            if (opts.removeNumbers) {
                output = output.replace(/\d+/g, '');
            }

            // Remove punctuation
            if (opts.removePunctuation) {
                output = output.replace(/[.,!?;:'"()\[\]{}]/g, '');
            }

            // Remove special characters
            if (opts.removeSpecialChars) {
                output = output.replace(/[^\w\s]/g, '');
            }

            // Limit line length
            if (opts.maxLineLength > 0) {
                output = this.wrapText(output, opts.maxLineLength);
            }

            // Apply indentation
            if (opts.indentSize > 0) {
                output = this.indentText(output, opts.indentSize);
            }

            const processingTime = performance.now() - startTime;

            // Calculate statistics
            const lines = output.split('\n').length;
            const words = output.split(/\s+/).filter(w => w.length > 0).length;
            const characters = output.length;

            return {
                output,
                metadata: {
                    lines,
                    words,
                    characters,
                    processingTime,
                    options: opts
                }
            };

        } catch (error) {
            throw new Error(`Text formatting failed: ${error.message}`);
        }
    }

    capitalizeText(text) {
        return text.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    }

    wrapText(text, maxLength) {
        const lines = text.split('\n');
        const wrappedLines = [];
        
        for (const line of lines) {
            if (line.length <= maxLength) {
                wrappedLines.push(line);
                continue;
            }
            
            let currentLine = '';
            const words = line.split(' ');
            
            for (const word of words) {
                if (currentLine.length + word.length + 1 <= maxLength) {
                    currentLine += (currentLine ? ' ' : '') + word;
                } else {
                    if (currentLine) {
                        wrappedLines.push(currentLine);
                    }
                    currentLine = word;
                }
            }
            
            if (currentLine) {
                wrappedLines.push(currentLine);
            }
        }
        
        return wrappedLines.join('\n');
    }

    indentText(text, indentSize) {
        const indent = ' '.repeat(indentSize);
        return text.split('\n').map(line => indent + line).join('\n');
    }

    // Additional utility methods
    removeDuplicates(text) {
        const lines = text.split('\n');
        const uniqueLines = [...new Set(lines)];
        return uniqueLines.join('\n');
    }

    sortLines(text, reverse = false) {
        const lines = text.split('\n');
        lines.sort();
        if (reverse) {
            lines.reverse();
        }
        return lines.join('\n');
    }

    reverseText(text) {
        return text.split('').reverse().join('');
    }

    countOccurrences(text, search) {
        const regex = new RegExp(search, 'gi');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
    }

    findAndReplace(text, find, replace, caseSensitive = false) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
        return text.replace(regex, replace);
    }
}

export default TextFormatter;