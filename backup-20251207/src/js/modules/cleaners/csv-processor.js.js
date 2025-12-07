/**
 * CSV Processor - Professional CSV cleaning and formatting
 */

class CSVProcessor {
    constructor() {
        this.name = 'CSV Processor';
        this.description = 'Clean, format, and validate CSV data';
        this.supportedFormats = ['.csv', '.tsv'];
        this.defaultOptions = {
            delimiter: ',',
            hasHeader: true,
            trimFields: true,
            removeEmptyRows: true,
            quoteStrings: true,
            escapeQuotes: true,
            normalizeLineEndings: true,
        };
    }

    async process(input, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const startTime = performance.now();

        try {
            // Validate CSV structure
            const validation = this.validateCSV(input, opts);
            if (!validation.valid) {
                throw new Error(`Invalid CSV: ${validation.error}`);
            }

            let processed = input;

            // Normalize line endings
            if (opts.normalizeLineEndings) {
                processed = processed.replace(/\r\n|\r/g, '\n');
            }

            // Split into rows
            const rows = this.parseCSV(processed, opts);
            
            // Apply transformations
            const transformedRows = this.transformRows(rows, opts);
            
            // Convert back to CSV string
            const output = this.stringifyCSV(transformedRows, opts);

            const processingTime = performance.now() - startTime;

            return {
                output,
                metadata: {
                    rowCount: transformedRows.length,
                    columnCount: transformedRows[0]?.length || 0,
                    processingTime,
                    options: opts,
                    validation: validation,
                },
            };

        } catch (error) {
            throw new Error(`CSV processing failed: ${error.message}`);
        }
    }

    parseCSV(csvString, options) {
        const { delimiter, hasHeader, quoteStrings } = options;
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let insideQuotes = false;
        let rowStart = 0;

        for (let i = 0; i < csvString.length; i++) {
            const char = csvString[i];
            const nextChar = csvString[i + 1];

            if (char === '"' && quoteStrings) {
                if (insideQuotes && nextChar === '"') {
                    // Escaped quote
                    currentField += '"';
                    i++; // Skip next character
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === delimiter && !insideQuotes) {
                // End of field
                currentRow.push(this.cleanField(currentField, options));
                currentField = '';
            } else if (char === '\n' && !insideQuotes) {
                // End of row
                currentRow.push(this.cleanField(currentField, options));
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
                rowStart = i + 1;
            } else {
                currentField += char;
            }
        }

        // Add last field and row
        if (currentField.trim() !== '' || currentRow.length > 0) {
            currentRow.push(this.cleanField(currentField, options));
            rows.push(currentRow);
        }

        // Remove header if needed
        if (!options.hasHeader && rows.length > 0) {
            rows.shift();
        }

        return rows;
    }

    cleanField(field, options) {
        let cleaned = field;

        if (options.trimFields) {
            cleaned = cleaned.trim();
        }

        // Remove surrounding quotes if present
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
        }

        // Unescape quotes
        cleaned = cleaned.replace(/""/g, '"');

        return cleaned;
    }

    transformRows(rows, options) {
        if (!options.removeEmptyRows) {
            return rows;
        }

        return rows.filter(row => {
            // Check if row has any non-empty fields
            return row.some(field => field.trim() !== '');
        });
    }

    stringifyCSV(rows, options) {
        const { delimiter, quoteStrings } = options;
        
        return rows.map(row => {
            return row.map(field => {
                let fieldStr = String(field);
                
                // Escape quotes
                if (quoteStrings) {
                    fieldStr = fieldStr.replace(/"/g, '""');
                    
                    // Quote field if it contains delimiter, quotes, or newlines
                    if (fieldStr.includes(delimiter) || 
                        fieldStr.includes('"') || 
                        fieldStr.includes('\n')) {
                        fieldStr = `"${fieldStr}"`;
                    }
                }
                
                return fieldStr;
            }).join(delimiter);
        }).join('\n');
    }

    validateCSV(csvString, options) {
        const lines = csvString.split('\n');
        
        if (lines.length === 0) {
            return { valid: false, error: 'Empty CSV' };
        }

        // Check if all rows have same number of columns
        const expectedColumns = lines[0].split(options.delimiter).length;
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const columns = this.countColumns(lines[i], options);
            if (columns !== expectedColumns) {
                return {
                    valid: false,
                    error: `Row ${i + 1} has ${columns} columns, expected ${expectedColumns}`,
                };
            }
        }

        return { valid: true, rowCount: lines.length, columnCount: expectedColumns };
    }

    countColumns(line, options) {
        let count = 0;
        let insideQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"' && options.quoteStrings) {
                if (insideQuotes && nextChar === '"') {
                    i++; // Skip escaped quote
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === options.delimiter && !insideQuotes) {
                count++;
            }
        }
        
        return count + 1; // Add one for last column
    }
}

export default CSVProcessor;