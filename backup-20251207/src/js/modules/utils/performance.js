/**
 * Performance - Performance monitoring and optimization utilities
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.history = [];
        this.maxHistorySize = 1000;
        this.startTime = performance.now();
        this.marks = new Map();
        this.measures = new Map();
        
        // Start monitoring
        this.startMonitoring();
    }

    // Mark a point in time
    mark(name) {
        const timestamp = performance.now();
        this.marks.set(name, timestamp);
        return timestamp;
    }

    // Measure between two marks
    measure(name, startMark, endMark) {
        const start = this.marks.get(startMark);
        const end = this.marks.get(endMark);
        
        if (!start || !end) {
            console.warn(`Cannot measure ${name}: marks not found`);
            return null;
        }
        
        const duration = end - start;
        this.measures.set(name, duration);
        
        this.recordMetric('measure', {
            name,
            duration,
            start,
            end
        });
        
        return duration;
    }

    // Record a custom metric
    recordMetric(type, data) {
        const timestamp = performance.now();
        const metric = {
            type,
            data,
            timestamp,
            sessionTime: timestamp - this.startTime
        };
        
        this.history.push(metric);
        
        // Keep history size manageable
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(-this.maxHistorySize);
        }
        
        // Update aggregated metrics
        this.updateAggregatedMetrics(type, data);
        
        return metric;
    }

    updateAggregatedMetrics(type, data) {
        if (!this.metrics.has(type)) {
            this.metrics.set(type, {
                count: 0,
                totalDuration: 0,
                minDuration: Infinity,
                maxDuration: 0,
                lastTimestamp: 0
            });
        }
        
        const metric = this.metrics.get(type);
        metric.count++;
        metric.lastTimestamp = performance.now();
        
        if (data.duration !== undefined) {
            metric.totalDuration += data.duration;
            metric.minDuration = Math.min(metric.minDuration, data.duration);
            metric.maxDuration = Math.max(metric.maxDuration, data.duration);
        }
    }

    // Get performance metrics
    getMetrics(type = null) {
        if (type) {
            return this.metrics.get(type) || null;
        }
        
        return Object.fromEntries(this.metrics.entries());
    }

    // Get average duration for a metric type
    getAverageDuration(type) {
        const metric = this.metrics.get(type);
        if (!metric || metric.count === 0) return 0;
        return metric.totalDuration / metric.count;
    }

    // Get performance summary
    getSummary() {
        const now = performance.now();
        const sessionDuration = now - this.startTime;
        
        const metrics = this.getMetrics();
        const summary = {
            sessionDuration,
            totalMetrics: this.history.length,
            metricTypes: Array.from(this.metrics.keys()),
            averages: {},
            totals: {}
        };
        
        // Calculate averages and totals
        for (const [type, metric] of this.metrics.entries()) {
            if (metric.count > 0) {
                summary.averages[type] = metric.totalDuration / metric.count;
                summary.totals[type] = metric.totalDuration;
            }
        }
        
        return summary;
    }

    // Get history for a specific metric type
    getHistory(type = null, limit = 100) {
        let history = this.history;
        
        if (type) {
            history = history.filter(item => item.type === type);
        }
        
        return history.slice(-limit);
    }

    // Start continuous monitoring
    startMonitoring() {
        // Monitor memory usage if available
        if (performance.memory) {
            setInterval(() => {
                this.recordMemoryUsage();
            }, 10000); // Every 10 seconds
        }
        
        // Monitor frame rate
        this.startFPSMonitoring();
        
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            this.startLongTaskMonitoring();
        }
    }

    // Record memory usage
    recordMemoryUsage() {
        if (!performance.memory) return;
        
        const memory = performance.memory;
        this.recordMetric('memory', {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        });
    }

    // Start FPS monitoring
    startFPSMonitoring() {
        let frames = 0;
        let lastTime = performance.now();
        
        const checkFPS = () => {
            frames++;
            const currentTime = performance.now();
            const elapsed = currentTime - lastTime;
            
            if (elapsed >= 1000) { // Every second
                const fps = Math.round((frames * 1000) / elapsed);
                
                this.recordMetric('fps', {
                    fps,
                    frames,
                    elapsed
                });
                
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(checkFPS);
        };
        
        requestAnimationFrame(checkFPS);
    }

    // Start long task monitoring
    startLongTaskMonitoring() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) { // Tasks longer than 50ms
                        this.recordMetric('long_task', {
                            duration: entry.duration,
                            startTime: entry.startTime,
                            name: entry.name || 'unknown'
                        });
                    }
                }
            });
            
            observer.observe({ entryTypes: ['longtask'] });
        } catch (error) {
            console.warn('Long task monitoring not supported:', error);
        }
    }

    // Measure function performance
    measureFunction(fn, iterations = 1, ...args) {
        const start = performance.now();
        let result;
        
        for (let i = 0; i < iterations; i++) {
            result = fn(...args);
        }
        
        const end = performance.now();
        const duration = end - start;
        
        this.recordMetric('function', {
            name: fn.name || 'anonymous',
            duration,
            iterations,
            averageDuration: duration / iterations,
            args: args.length
        });
        
        return {
            result,
            duration,
            averageDuration: duration / iterations,
            iterations
        };
    }

    // Benchmark multiple functions
    benchmark(functions, iterations = 1000, ...args) {
        const results = [];
        
        for (const [name, fn] of Object.entries(functions)) {
            const measurement = this.measureFunction(fn, iterations, ...args);
            results.push({
                name,
                ...measurement
            });
        }
        
        // Sort by average duration
        results.sort((a, b) => a.averageDuration - b.averageDuration);
        
        return results;
    }

    // Get performance bottlenecks
    getBottlenecks(threshold = 100) {
        const bottlenecks = [];
        
        for (const [type, metric] of this.metrics.entries()) {
            if (metric.count > 0) {
                const average = metric.totalDuration / metric.count;
                if (average > threshold) {
                    bottlenecks.push({
                        type,
                        averageDuration: average,
                        totalCalls: metric.count,
                        totalTime: metric.totalDuration
                    });
                }
            }
        }
        
        return bottlenecks.sort((a, b) => b.averageDuration - a.averageDuration);
    }

    // Export performance data
    exportData(format = 'json') {
        const data = {
            summary: this.getSummary(),
            metrics: this.getMetrics(),
            history: this.getHistory(null, 1000),
            timestamp: new Date().toISOString()
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
                
            case 'csv':
                // Convert history to CSV
                const headers = ['Type', 'Timestamp', 'SessionTime', 'Duration', 'Data'];
                const rows = data.history.map(item => [
                    item.type,
                    item.timestamp,
                    item.sessionTime,
                    item.data.duration || '',
                    JSON.stringify(item.data)
                ]);
                
                return [
                    headers.join(','),
                    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    // Reset all metrics
    reset() {
        this.metrics.clear();
        this.history = [];
        this.marks.clear();
        this.measures.clear();
        this.startTime = performance.now();
        
        return { success: true, message: 'Performance metrics reset' };
    }

    // Get resource timing
    getResourceTiming() {
        if (!performance.getEntriesByType) return [];
        
        return performance.getEntriesByType('resource').map(resource => ({
            name: resource.name,
            duration: resource.duration,
            initiatorType: resource.initiatorType,
            transferSize: resource.transferSize,
            decodedBodySize: resource.decodedBodySize,
            startTime: resource.startTime
        }));
    }

    // Get navigation timing
    getNavigationTiming() {
        if (!performance.timing) return null;
        
        const timing = performance.timing;
        const navigation = {
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            connect: timing.connectEnd - timing.connectStart,
            request: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
            domLoading: timing.domLoading - timing.navigationStart,
            domInteractive: timing.domInteractive - timing.navigationStart,
            domComplete: timing.domComplete - timing.navigationStart,
            loadEvent: timing.loadEventEnd - timing.loadEventStart,
            total: timing.loadEventEnd - timing.navigationStart
        };
        
        return navigation;
    }

    // Detect performance issues
    detectIssues() {
        const issues = [];
        const summary = this.getSummary();
        
        // Check for low FPS
        const fpsHistory = this.getHistory('fps', 10);
        if (fpsHistory.length > 0) {
            const avgFPS = fpsHistory.reduce((sum, item) => sum + item.data.fps, 0) / fpsHistory.length;
            if (avgFPS < 30) {
                issues.push({
                    type: 'low_fps',
                    severity: 'warning',
                    message: `Low frame rate detected: ${avgFPS.toFixed(1)} FPS`,
                    average: avgFPS
                });
            }
        }
        
        // Check for memory issues
        const memoryHistory = this.getHistory('memory', 5);
        if (memoryHistory.length > 0) {
            const lastMemory = memoryHistory[memoryHistory.length - 1].data;
            if (lastMemory.percentage > 80) {
                issues.push({
                    type: 'high_memory',
                    severity: 'error',
                    message: `High memory usage: ${lastMemory.percentage.toFixed(1)}%`,
                    usage: lastMemory.percentage
                });
            }
        }
        
        // Check for long tasks
        const longTasks = this.getHistory('long_task', 10);
        if (longTasks.length > 5) {
            issues.push({
                type: 'many_long_tasks',
                severity: 'warning',
                message: `Many long tasks detected: ${longTasks.length} in recent history`,
                count: longTasks.length
            });
        }
        
        return issues;
    }

    // Optimize performance
    optimize() {
        const optimizations = [];
        
        // Clear marks and measures
        if (this.marks.size > 100) {
            this.marks.clear();
            optimizations.push('Cleared performance marks');
        }
        
        if (this.measures.size > 100) {
            this.measures.clear();
            optimizations.push('Cleared performance measures');
        }
        
        // Trim history
        if (this.history.length > this.maxHistorySize * 2) {
            this.history = this.history.slice(-this.maxHistorySize);
            optimizations.push('Trimmed performance history');
        }
        
        // Suggest optimizations based on metrics
        const bottlenecks = this.getBottlenecks();
        for (const bottleneck of bottlenecks) {
            optimizations.push(`Consider optimizing ${bottleneck.type} (avg: ${bottleneck.averageDuration.toFixed(2)}ms)`);
        }
        
        return {
            success: true,
            optimizations,
            timestamp: new Date().toISOString()
        };
    }
}

export default PerformanceMonitor;