/**
 * File Handler - Handle file uploads and downloads
 */

class FileHandler {
    constructor() {
        this.supportedFormats = {
            text: ['.txt', '.md', '.log', '.csv', '.json', '.xml', '.html', '.css', '.js'],
            csv: ['.csv', '.tsv'],
            json: ['.json'],
            code: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.html', '.css', '.php']
        };
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: event.target.result,
                    lastModified: file.lastModified
                });
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            // Read as text for text-based files
            if (file.type.startsWith('text/') || 
                this.supportedFormats.text.some(ext => file.name.endsWith(ext))) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }

    async readMultipleFiles(files) {
        const results = [];
        for (const file of files) {
            try {
                const content = await this.readFile(file);
                results.push(content);
            } catch (error) {
                console.error(`Failed to read file ${file.name}:`, error);
                results.push({
                    name: file.name,
                    error: error.message
                });
            }
        }
        return results;
    }

    downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    downloadAsCSV(data, filename = 'data.csv') {
        let csvContent = '';
        
        if (Array.isArray(data) && data.length > 0) {
            // If array of objects, convert to CSV
            if (typeof data[0] === 'object') {
                const headers = Object.keys(data[0]);
                csvContent = headers.join(',') + '\n';
                
                csvContent += data.map(row => {
                    return headers.map(header => {
                        const cell = row[header];
                        // Handle commas and quotes in CSV
                        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                            return `"${cell.replace(/"/g, '""')}"`;
                        }
                        return cell;
                    }).join(',');
                }).join('\n');
            } else {
                csvContent = data.join('\n');
            }
        } else if (typeof data === 'string') {
            csvContent = data;
        }
        
        this.downloadFile(csvContent, filename, 'text/csv');
    }

    downloadAsJSON(data, filename = 'data.json') {
        const jsonString = JSON.stringify(data, null, 2);
        this.downloadFile(jsonString, filename, 'application/json');
    }

    async loadFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            return text;
        } catch (error) {
            console.error('Failed to read clipboard:', error);
            throw error;
        }
    }

    async saveToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to write to clipboard:', error);
            throw error;
        }
    }

    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    }

    isValidFileType(filename, allowedTypes) {
        const ext = this.getFileExtension(filename).toLowerCase();
        return allowedTypes.some(type => type.toLowerCase() === `.${ext}`);
    }
}

export default FileHandler;