/**
 * Clipboard - Copy/paste operations with enhanced features
 */

class ClipboardManager {
    constructor() {
        this.history = [];
        this.maxHistorySize = 50;
        this.isSupported = 'clipboard' in navigator;
    }

    async copy(text, options = {}) {
        try {
            if (!this.isSupported) {
                return this.fallbackCopy(text);
            }

            const { format = 'text/plain', metadata = {} } = options;
            
            // Try the modern Clipboard API first
            if (format === 'text/plain') {
                await navigator.clipboard.writeText(text);
            } else {
                // For other formats (HTML, etc.)
                const blob = new Blob([text], { type: format });
                const data = [new ClipboardItem({ [format]: blob })];
                await navigator.clipboard.write(data);
            }

            // Add to history
            this.addToHistory({
                type: 'copy',
                content: text,
                format,
                metadata,
                timestamp: Date.now(),
                success: true
            });

            return {
                success: true,
                message: 'Copied to clipboard',
                length: text.length,
                format
            };

        } catch (error) {
            console.error('Copy failed:', error);
            
            // Try fallback method
            try {
                return this.fallbackCopy(text);
            } catch (fallbackError) {
                return {
                    success: false,
                    error: 'Failed to copy to clipboard',
                    details: error.message
                };
            }
        }
    }

    fallbackCopy(text) {
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        
        // Select and copy
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
            this.addToHistory({
                type: 'copy',
                content: text,
                format: 'text/plain',
                timestamp: Date.now(),
                success: true,
                method: 'fallback'
            });
            
            return {
                success: true,
                message: 'Copied to clipboard (fallback method)',
                length: text.length,
                method: 'fallback'
            };
        } else {
            return {
                success: false,
                error: 'Fallback copy method failed'
            };
        }
    }

    async paste(options = {}) {
        try {
            if (!this.isSupported) {
                return this.fallbackPaste();
            }

            const { format = 'text/plain' } = options;
            let content;

            if (format === 'text/plain') {
                content = await navigator.clipboard.readText();
            } else {
                const clipboardItems = await navigator.clipboard.read();
                for (const item of clipboardItems) {
                    if (item.types.includes(format)) {
                        const blob = await item.getType(format);
                        content = await blob.text();
                        break;
                    }
                }
            }

            if (content) {
                // Add to history
                this.addToHistory({
                    type: 'paste',
                    content,
                    format,
                    timestamp: Date.now(),
                    success: true
                });

                return {
                    success: true,
                    content,
                    length: content.length,
                    format
                };
            } else {
                return {
                    success: false,
                    error: 'No content found in clipboard'
                };
            }

        } catch (error) {
            console.error('Paste failed:', error);
            
            // Try fallback method
            try {
                return this.fallbackPaste();
            } catch (fallbackError) {
                return {
                    success: false,
                    error: 'Failed to paste from clipboard',
                    details: error.message
                };
            }
        }
    }

    fallbackPaste() {
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        
        // Focus and attempt paste
        textarea.focus();
        const successful = document.execCommand('paste');
        
        let content = '';
        if (successful) {
            content = textarea.value;
        }
        
        document.body.removeChild(textarea);
        
        if (successful && content) {
            this.addToHistory({
                type: 'paste',
                content,
                format: 'text/plain',
                timestamp: Date.now(),
                success: true,
                method: 'fallback'
            });
            
            return {
                success: true,
                content,
                length: content.length,
                method: 'fallback'
            };
        } else {
            return {
                success: false,
                error: 'Fallback paste method failed'
            };
        }
    }

    async copyHTML(html, plainTextFallback = '') {
        try {
            // Create a blob with HTML content
            const htmlBlob = new Blob([html], { type: 'text/html' });
            const textBlob = new Blob([plainTextFallback || html.replace(/<[^>]*>/g, '')], { type: 'text/plain' });
            
            const data = [
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                })
            ];
            
            await navigator.clipboard.write(data);
            
            this.addToHistory({
                type: 'copy',
                content: html,
                format: 'text/html',
                timestamp: Date.now(),
                success: true
            });
            
            return {
                success: true,
                message: 'HTML copied to clipboard',
                length: html.length
            };
            
        } catch (error) {
            console.error('HTML copy failed:', error);
            
            // Fallback to plain text
            return this.copy(plainTextFallback || html.replace(/<[^>]*>/g, ''));
        }
    }

    async copyImage(imageUrl) {
        try {
            // Fetch the image
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // Copy to clipboard
            const data = [new ClipboardItem({ [blob.type]: blob })];
            await navigator.clipboard.write(data);
            
            return {
                success: true,
                message: 'Image copied to clipboard',
                type: blob.type
            };
            
        } catch (error) {
            console.error('Image copy failed:', error);
            return {
                success: false,
                error: 'Failed to copy image'
            };
        }
    }

    async copyRichContent(content, formats = {}) {
        try {
            const items = {};
            
            // Prepare each format
            for (const [format, data] of Object.entries(formats)) {
                const blob = new Blob([data], { type: format });
                items[format] = blob;
            }
            
            // Always include plain text if not provided
            if (!items['text/plain'] && content) {
                items['text/plain'] = new Blob([content], { type: 'text/plain' });
            }
            
            const clipboardItem = new ClipboardItem(items);
            await navigator.clipboard.write([clipboardItem]);
            
            this.addToHistory({
                type: 'copy',
                content,
                formats: Object.keys(formats),
                timestamp: Date.now(),
                success: true
            });
            
            return {
                success: true,
                message: 'Rich content copied to clipboard',
                formats: Object.keys(formats)
            };
            
        } catch (error) {
            console.error('Rich content copy failed:', error);
            return this.copy(content);
        }
    }

    addToHistory(entry) {
        this.history.unshift(entry);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.pop();
        }
        
        // Save to localStorage
        this.saveHistory();
    }

    getHistory(filter = {}) {
        let filtered = this.history;
        
        if (filter.type) {
            filtered = filtered.filter(entry => entry.type === filter.type);
        }
        
        if (filter.format) {
            filtered = filtered.filter(entry => entry.format === filter.format);
        }
        
        if (filter.startDate) {
            filtered = filtered.filter(entry => entry.timestamp >= filter.startDate);
        }
        
        if (filter.endDate) {
            filtered = filtered.filter(entry => entry.timestamp <= filter.endDate);
        }
        
        return filtered;
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    saveHistory() {
        try {
            localStorage.setItem('clipboard_history', JSON.stringify(this.history));
        } catch (error) {
            console.error('Failed to save clipboard history:', error);
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('clipboard_history');
            if (saved) {
                this.history = JSON.parse(saved);
                return true;
            }
        } catch (error) {
            console.error('Failed to load clipboard history:', error);
        }
        return false;
    }

    exportHistory(format = 'json') {
        const history = this.getHistory();
        
        switch (format) {
            case 'json':
                return JSON.stringify(history, null, 2);
                
            case 'csv':
                const headers = ['Type', 'Content', 'Format', 'Timestamp', 'Success'];
                const rows = history.map(entry => [
                    entry.type,
                    entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : ''),
                    entry.format || 'text/plain',
                    new Date(entry.timestamp).toISOString(),
                    entry.success ? 'Yes' : 'No'
                ]);
                
                return [
                    headers.join(','),
                    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');
                
            case 'html':
                return `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Clipboard History</title>
                        <style>
                            table { border-collapse: collapse; width: 100%; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .success { color: green; }
                            .error { color: red; }
                        </style>
                    </head>
                    <body>
                        <h1>Clipboard History</h1>
                        <p>Generated: ${new Date().toLocaleString()}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Content</th>
                                    <th>Format</th>
                                    <th>Timestamp</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.map(entry => `
                                    <tr>
                                        <td>${entry.type}</td>
                                        <td>${this.escapeHtml(entry.content.substring(0, 100))}${entry.content.length > 100 ? '...' : ''}</td>
                                        <td>${entry.format || 'text/plain'}</td>
                                        <td>${new Date(entry.timestamp).toLocaleString()}</td>
                                        <td class="${entry.success ? 'success' : 'error'}">
                                            ${entry.success ? 'Success' : 'Failed'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                    </html>
                `;
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Utility method to copy from a DOM element
    copyFromElement(element, options = {}) {
        const text = options.text || element.textContent || element.value;
        return this.copy(text, options);
    }

    // Watch for clipboard changes (experimental)
    watchClipboard(onChange) {
        if (!this.isSupported) return null;
        
        const interval = setInterval(async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text !== this.lastClipboardText) {
                    this.lastClipboardText = text;
                    onChange(text);
                }
            } catch (error) {
                // Ignore permission errors
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }

    // Check clipboard permissions
    async checkPermission() {
        if (!this.isSupported) {
            return { state: 'unsupported' };
        }
        
        try {
            const result = await navigator.permissions.query({ name: 'clipboard-read' });
            return {
                state: result.state,
                canRead: result.state === 'granted',
                canWrite: true // Write permission is generally granted
            };
        } catch (error) {
            return {
                state: 'error',
                error: error.message
            };
        }
    }
}

export default ClipboardManager;