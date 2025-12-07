/**
 * Batch Processor - Process multiple files/texts in batch
 */

class BatchProcessor {
    constructor() {
        this.maxBatchSize = 100;
        this.supportedFormats = {
            text: ['.txt', '.md', '.log'],
            data: ['.csv', '.json', '.xml'],
            code: ['.js', '.ts', '.py', '.java', '.html', '.css']
        };
    }

    async processBatch(items, processor, options = {}) {
        const startTime = performance.now();
        const results = [];
        const errors = [];

        try {
            // Validate batch size
            if (items.length > this.maxBatchSize) {
                throw new Error(`Batch size exceeds maximum of ${this.maxBatchSize}`);
            }

            // Process each item
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                
                try {
                    const result = await processor.process(item.content, {
                        ...options,
                        filename: item.name
                    });

                    results.push({
                        index: i,
                        name: item.name,
                        success: true,
                        originalSize: item.content.length,
                        processedSize: result.output.length,
                        processingTime: result.metadata?.processingTime || 0,
                        output: result.output,
                        metadata: result.metadata
                    });

                } catch (error) {
                    errors.push({
                        index: i,
                        name: item.name,
                        success: false,
                        error: error.message
                    });
                    
                    // Continue with other items if continueOnError is true
                    if (!options.continueOnError) {
                        throw error;
                    }
                }

                // Report progress if callback provided
                if (options.onProgress) {
                    options.onProgress({
                        processed: i + 1,
                        total: items.length,
                        percentage: Math.round(((i + 1) / items.length) * 100)
                    });
                }
            }

            const totalTime = performance.now() - startTime;

            return {
                success: true,
                totalItems: items.length,
                successful: results.length,
                failed: errors.length,
                totalTime,
                results,
                errors,
                summary: this.generateSummary(results, errors, totalTime)
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                totalItems: items.length,
                successful: results.length,
                failed: errors.length,
                results,
                errors
            };
        }
    }

    generateSummary(results, errors, totalTime) {
        const totalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
        const totalProcessedSize = results.reduce((sum, r) => sum + r.processedSize, 0);
        const totalProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0);
        
        return {
            totalFiles: results.length + errors.length,
            successfulFiles: results.length,
            failedFiles: errors.length,
            totalSize,
            totalProcessedSize,
            sizeReduction: totalSize > 0 ? ((totalSize - totalProcessedSize) / totalSize) * 100 : 0,
            averageProcessingTime: results.length > 0 ? totalProcessingTime / results.length : 0,
            totalBatchTime: totalTime,
            efficiency: totalTime > 0 ? (totalProcessingTime / totalTime) * 100 : 0
        };
    }

    async processFiles(files, processor, options = {}) {
        // Read all files first
        const fileContents = [];
        const errors = [];

        for (const file of files) {
            try {
                const content = await this.readFileAsText(file);
                fileContents.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    content,
                    lastModified: file.lastModified
                });
            } catch (error) {
                errors.push({
                    name: file.name,
                    error: `Failed to read file: ${error.message}`
                });
                
                if (!options.continueOnError) {
                    throw new Error(`Failed to read file ${file.name}: ${error.message}`);
                }
            }
        }

        // Process the file contents
        return this.processBatch(fileContents, processor, options);
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    async exportResults(results, format = 'zip', options = {}) {
        switch (format.toLowerCase()) {
            case 'zip':
                return await this.createZipArchive(results, options);
            case 'json':
                return this.exportAsJSON(results, options);
            case 'csv':
                return this.exportAsCSV(results, options);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    async createZipArchive(results, options) {
        // Note: This would require a zip library like JSZip
        // For now, return a mock implementation
        console.log('Creating ZIP archive with', results.length, 'files');
        
        return {
            format: 'zip',
            fileCount: results.length,
            totalSize: results.reduce((sum, r) => sum + r.processedSize, 0),
            downloadUrl: '#', // Would be a blob URL in real implementation
            filename: options.filename || `batch_${Date.now()}.zip`
        };
    }

    exportAsJSON(results, options) {
        const data = {
            metadata: {
                exportedAt: new Date().toISOString(),
                totalFiles: results.length,
                exportFormat: 'json'
            },
            results: results.map(r => ({
                name: r.name,
                success: r.success,
                size: r.processedSize,
                content: options.includeContent ? r.output : undefined,
                metadata: r.metadata
            }))
        };

        const jsonString = JSON.stringify(data, null, options.pretty ? 2 : 0);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        return {
            format: 'json',
            blob,
            filename: options.filename || `batch_${Date.now()}.json`
        };
    }

    exportAsCSV(results, options) {
        const headers = ['Filename', 'Status', 'Original Size', 'Processed Size', 'Processing Time (ms)'];
        const rows = results.map(r => [
            r.name,
            r.success ? 'Success' : 'Failed',
            r.originalSize,
            r.processedSize,
            r.processingTime.toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        
        return {
            format: 'csv',
            blob,
            filename: options.filename || `batch_${Date.now()}.csv`
        };
    }

    validateBatch(items, maxTotalSize = 100 * 1024 * 1024) { // 100MB default
        const totalSize = items.reduce((sum, item) => sum + (item.size || item.content.length), 0);
        
        if (totalSize > maxTotalSize) {
            return {
                valid: false,
                error: `Total batch size (${this.formatBytes(totalSize)}) exceeds limit of ${this.formatBytes(maxTotalSize)}`
            };
        }

        if (items.length === 0) {
            return {
                valid: false,
                error: 'No items to process'
            };
        }

        return {
            valid: true,
            totalItems: items.length,
            totalSize
        };
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Utility to split large batch into chunks
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    async processInChunks(items, processor, chunkSize = 10, options = {}) {
        const chunks = this.chunkArray(items, chunkSize);
        const allResults = [];
        const allErrors = [];
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            if (options.onChunkStart) {
                options.onChunkStart(i + 1, chunks.length);
            }
            
            const result = await this.processBatch(chunk, processor, options);
            
            allResults.push(...result.results);
            allErrors.push(...result.errors);
            
            if (options.onChunkComplete) {
                options.onChunkComplete(i + 1, chunks.length, result);
            }
        }
        
        return {
            success: allErrors.length === 0,
            totalItems: items.length,
            successful: allResults.length,
            failed: allErrors.length,
            results: allResults,
            errors: allErrors
        };
    }
}

export default BatchProcessor;