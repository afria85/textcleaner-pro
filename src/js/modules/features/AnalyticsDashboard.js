/**
 * Analytics Dashboard
 * Real-time analytics, metrics tracking, and insights
 */

import EventEmitter from '@/js/utils/EventEmitter';
import { debounce, throttle } from '@/js/utils/Debounce';
import Storage from '@/js/modules/storage/IndexedDB';

class AnalyticsDashboard extends EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.realtimeData = [];
        this.insights = new Set();
        this.storage = new Storage('analytics');
        this.maxDataPoints = 10000;
        this.updateInterval = null;
        this.initialized = false;
        
        // Performance monitoring
        this.performanceMetrics = {
            fps: 0,
            memory: 0,
            cpu: 0,
            networkLatency: 0,
        };
    }

    /**
     * Initialize analytics dashboard
     */
    async init() {
        try {
            // Load historical data
            await this.loadHistoricalData();
            
            // Start real-time updates
            this.startRealtimeUpdates();
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            // Set up error tracking
            this.setupErrorTracking();
            
            // Set up user behavior tracking
            this.setupUserBehaviorTracking();
            
            this.initialized = true;
            this.emit('initialized');
            
            console.info('Analytics Dashboard initialized');
        } catch (error) {
            console.error('Failed to initialize Analytics Dashboard:', error);
        }
    }

    /**
     * Track user event
     */
    trackEvent(eventName, properties = {}) {
        const event = {
            id: this.generateId(),
            name: eventName,
            timestamp: Date.now(),
            properties,
            sessionId: this.getSessionId(),
            userId: this.getUserId(),
        };

        // Store event
        this.realtimeData.push(event);
        
        // Update metrics
        this.updateMetrics(eventName, properties);
        
        // Generate insights
        this.generateInsights(event);
        
        // Debounced save to storage
        this.saveEventDebounced(event);
        
        // Emit event for real-time updates
        this.emit('event:tracked', event);
        
        return event;
    }

    /**
     * Track performance metric
     */
    trackPerformance(metricName, value, metadata = {}) {
        const metric = {
            name: metricName,
            value,
            timestamp: Date.now(),
            metadata,
        };

        // Update performance metrics
        this.performanceMetrics[metricName] = value;
        
        // Store for analysis
        if (!this.metrics.has(metricName)) {
            this.metrics.set(metricName, []);
        }
        
        this.metrics.get(metricName).push(metric);
        
        // Keep within limits
        if (this.metrics.get(metricName).length > this.maxDataPoints) {
            this.metrics.get(metricName).shift();
        }
        
        // Check for performance issues
        this.checkPerformanceIssues(metricName, value);
        
        this.emit('performance:updated', metric);
    }

    /**
     * Track user behavior
     */
    trackUserBehavior(action, context = {}) {
        const behavior = {
            action,
            context,
            timestamp: Date.now(),
            userId: this.getUserId(),
            sessionDuration: this.getSessionDuration(),
        };

        // Analyze behavior patterns
        this.analyzeBehaviorPatterns(behavior);
        
        // Update user profile
        this.updateUserProfile(behavior);
        
        this.emit('behavior:tracked', behavior);
    }

    /**
     * Generate dashboard report
     */
    generateReport(timeRange = '7d') {
        const data = this.filterByTimeRange(timeRange);
        
        return {
            summary: this.generateSummary(data),
            trends: this.calculateTrends(data),
            insights: Array.from(this.insights),
            topEvents: this.getTopEvents(data),
            userStats: this.getUserStats(data),
            performance: this.getPerformanceStats(),
            recommendations: this.generateRecommendations(data),
        };
    }

    /**
     * Get real-time metrics
     */
    getRealtimeMetrics() {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        
        const recentEvents = this.realtimeData.filter(
            event => event.timestamp > oneHourAgo
        );

        return {
            eventsPerMinute: this.calculateEventsPerMinute(recentEvents),
            activeUsers: this.calculateActiveUsers(recentEvents),
            popularActions: this.getPopularActions(recentEvents),
            conversionRate: this.calculateConversionRate(recentEvents),
            errorRate: this.calculateErrorRate(recentEvents),
        };
    }

    /**
     * Generate insights from data
     */
    generateInsights(event) {
        // Analyze event patterns
        const patterns = this.analyzeEventPatterns(event);
        
        // Generate actionable insights
        patterns.forEach(pattern => {
            const insight = this.createInsight(pattern);
            if (insight) {
                this.insights.add(insight);
                this.emit('insight:generated', insight);
            }
        });

        // Clean up old insights
        if (this.insights.size > 100) {
            const insightsArray = Array.from(this.insights);
            this.insights = new Set(insightsArray.slice(-100));
        }
    }

    /**
     * Export analytics data
     */
    async exportData(format = 'json', options = {}) {
        const data = this.getAllData();
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(data, null, 2);
                
            case 'csv':
                return this.convertToCSV(data);
                
            case 'excel':
                return await this.convertToExcel(data);
                
            case 'pdf':
                return await this.generatePDFReport(data, options);
                
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor FPS
        this.monitorFPS();
        
        // Monitor memory usage
        this.monitorMemory();
        
        // Monitor network performance
        this.monitorNetwork();
        
        // Monitor CPU usage
        this.monitorCPU();
    }

    /**
     * Monitor frames per second
     */
    monitorFPS() {
        let lastTime = performance.now();
        let frames = 0;
        
        const calculateFPS = () => {
            frames++;
            const now = performance.now();
            
            if (now >= lastTime + 1000) {
                this.trackPerformance('fps', frames);
                frames = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(calculateFPS);
        };
        
        requestAnimationFrame(calculateFPS);
    }

    /**
     * Monitor memory usage
     */
    monitorMemory() {
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                this.trackPerformance('memory', memory.usedJSHeapSize, {
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                });
            }, 10000); // Every 10 seconds
        }
    }

    /**
     * Set up error tracking
     */
    setupErrorTracking() {
        // Track unhandled errors
        window.addEventListener('error', (event) => {
            this.trackEvent('error:unhandled', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.toString(),
            });
        });

        // Track promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackEvent('error:promise-rejection', {
                reason: event.reason?.toString(),
            });
        });

        // Track console errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.trackEvent('error:console', {
                arguments: args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ),
            });
            originalConsoleError.apply(console, args);
        };
    }

    /**
     * Set up user behavior tracking
     */
    setupUserBehaviorTracking() {
        // Track clicks
        document.addEventListener('click', debounce((event) => {
            this.trackUserBehavior('click', {
                target: event.target.tagName,
                id: event.target.id,
                className: event.target.className,
                x: event.clientX,
                y: event.clientY,
            });
        }, 100));

        // Track scrolling
        window.addEventListener('scroll', throttle(() => {
            this.trackUserBehavior('scroll', {
                scrollY: window.scrollY,
                scrollPercent: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100,
            });
        }, 500));

        // Track focus changes
        document.addEventListener('visibilitychange', () => {
            this.trackUserBehavior('visibility-change', {
                hidden: document.hidden,
            });
        });

        // Track keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey || event.altKey) {
                this.trackUserBehavior('keyboard-shortcut', {
                    key: event.key,
                    ctrlKey: event.ctrlKey,
                    metaKey: event.metaKey,
                    altKey: event.altKey,
                    shiftKey: event.shiftKey,
                });
            }
        });
    }

    /**
     * Start real-time updates
     */
    startRealtimeUpdates() {
        this.updateInterval = setInterval(() => {
            this.emit('realtime:update', this.getRealtimeMetrics());
        }, 5000); // Update every 5 seconds
    }

    /**
     * Load historical data
     */
    async loadHistoricalData() {
        try {
            const data = await this.storage.getAll('analytics_events');
            this.realtimeData = data.slice(-this.maxDataPoints);
            
            // Process historical data for insights
            this.processHistoricalData(data);
        } catch (error) {
            console.warn('Failed to load historical analytics data:', error);
        }
    }

    /**
     * Save event with debounce
     */
    saveEventDebounced = debounce(async (event) => {
        try {
            await this.storage.add('analytics_events', event);
        } catch (error) {
            console.warn('Failed to save analytics event:', error);
        }
    }, 1000);

    /**
     * Check for performance issues
     */
    checkPerformanceIssues(metricName, value) {
        const thresholds = {
            fps: 30,
            memory: 100 * 1024 * 1024, // 100MB
            networkLatency: 1000, // 1 second
        };

        if (thresholds[metricName] && value < thresholds[metricName]) {
            this.trackEvent('performance:warning', {
                metric: metricName,
                value,
                threshold: thresholds[metricName],
            });
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.removeAllListeners();
    }

    // Utility methods
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getSessionId() {
        return sessionStorage.getItem('session_id') || 'unknown';
    }

    getUserId() {
        return localStorage.getItem('user_id') || 'anonymous';
    }

    getSessionDuration() {
        const startTime = sessionStorage.getItem('session_start');
        return startTime ? Date.now() - parseInt(startTime) : 0;
    }

    filterByTimeRange(timeRange) {
        const now = Date.now();
        let startTime;
        
        switch (timeRange) {
            case '1h':
                startTime = now - (60 * 60 * 1000);
                break;
            case '24h':
                startTime = now - (24 * 60 * 60 * 1000);
                break;
            case '7d':
                startTime = now - (7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startTime = now - (30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = now - (7 * 24 * 60 * 60 * 1000);
        }
        
        return this.realtimeData.filter(event => event.timestamp > startTime);
    }

    // Additional methods would be implemented based on requirements
    calculateEventsPerMinute() { /* implementation */ }
    calculateActiveUsers() { /* implementation */ }
    getPopularActions() { /* implementation */ }
    calculateConversionRate() { /* implementation */ }
    calculateErrorRate() { /* implementation */ }
    analyzeEventPatterns() { /* implementation */ }
    createInsight() { /* implementation */ }
    analyzeBehaviorPatterns() { /* implementation */ }
    updateUserProfile() { /* implementation */ }
    generateSummary() { /* implementation */ }
    calculateTrends() { /* implementation */ }
    getTopEvents() { /* implementation */ }
    getUserStats() { /* implementation */ }
    getPerformanceStats() { /* implementation */ }
    generateRecommendations() { /* implementation */ }
    getAllData() { /* implementation */ }
    convertToCSV() { /* implementation */ }
    convertToExcel() { /* implementation */ }
    generatePDFReport() { /* implementation */ }
    monitorNetwork() { /* implementation */ }
    monitorCPU() { /* implementation */ }
    processHistoricalData() { /* implementation */ }
}

export default AnalyticsDashboard;