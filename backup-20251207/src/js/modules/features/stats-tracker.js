/**
 * Stats Tracker - Track application statistics and analytics
 */

class StatsTracker {
    constructor() {
        this.stats = {
            processing: {
                totalOperations: 0,
                totalCharacters: 0,
                totalWords: 0,
                totalLines: 0,
                totalFiles: 0,
                totalTime: 0
            },
            cleaners: {},
            formats: {},
            timeSaved: 0, // in seconds
            sessions: 0,
            lastReset: null
        };
        
        this.sessionStart = Date.now();
        this.currentSession = {
            startTime: this.sessionStart,
            operations: 0,
            characters: 0
        };
    }

    recordOperation(type, data) {
        const now = Date.now();
        
        // Update general stats
        this.stats.processing.totalOperations++;
        this.stats.processing.totalCharacters += data.characters || 0;
        this.stats.processing.totalWords += data.words || 0;
        this.stats.processing.totalLines += data.lines || 0;
        this.stats.processing.totalFiles += data.files || 0;
        this.stats.processing.totalTime += data.processingTime || 0;
        
        // Update cleaner-specific stats
        if (data.cleaner) {
            if (!this.stats.cleaners[data.cleaner]) {
                this.stats.cleaners[data.cleaner] = {
                    count: 0,
                    characters: 0,
                    time: 0
                };
            }
            this.stats.cleaners[data.cleaner].count++;
            this.stats.cleaners[data.cleaner].characters += data.characters || 0;
            this.stats.cleaners[data.cleaner].time += data.processingTime || 0;
        }
        
        // Update format-specific stats
        if (data.format) {
            if (!this.stats.formats[data.format]) {
                this.stats.formats[data.format] = {
                    count: 0,
                    characters: 0
                };
            }
            this.stats.formats[data.format].count++;
            this.stats.formats[data.format].characters += data.characters || 0;
        }
        
        // Calculate time saved (estimate: manual processing would take 10x longer)
        const timeSaved = (data.processingTime || 0) * 9;
        this.stats.timeSaved += timeSaved;
        
        // Update current session
        this.currentSession.operations++;
        this.currentSession.characters += data.characters || 0;
        
        // Save to storage periodically
        if (this.stats.processing.totalOperations % 10 === 0) {
            this.saveStats();
        }
        
        return {
            operationId: now,
            type,
            data,
            timeSaved
        };
    }

    getStats() {
        const sessionDuration = Date.now() - this.sessionStart;
        
        return {
            ...this.stats,
            currentSession: {
                ...this.currentSession,
                duration: sessionDuration,
                charactersPerMinute: sessionDuration > 0 ? 
                    (this.currentSession.characters / (sessionDuration / 60000)) : 0
            },
            averages: {
                charactersPerOperation: this.stats.processing.totalOperations > 0 ?
                    this.stats.processing.totalCharacters / this.stats.processing.totalOperations : 0,
                timePerOperation: this.stats.processing.totalOperations > 0 ?
                    this.stats.processing.totalTime / this.stats.processing.totalOperations : 0,
                operationsPerSession: this.stats.sessions > 0 ?
                    this.stats.processing.totalOperations / this.stats.sessions : 0
            }
        };
    }

    getCleanerStats(cleanerId = null) {
        if (cleanerId) {
            return this.stats.cleaners[cleanerId] || null;
        }
        
        return Object.entries(this.stats.cleaners).map(([id, stats]) => ({
            id,
            ...stats,
            averageCharacters: stats.count > 0 ? stats.characters / stats.count : 0,
            averageTime: stats.count > 0 ? stats.time / stats.count : 0
        })).sort((a, b) => b.count - a.count);
    }

    getFormatStats() {
        return Object.entries(this.stats.formats).map(([format, stats]) => ({
            format,
            ...stats,
            percentage: this.stats.processing.totalCharacters > 0 ?
                (stats.characters / this.stats.processing.totalCharacters) * 100 : 0
        })).sort((a, b) => b.count - a.count);
    }

    getTimeSaved() {
        return {
            seconds: this.stats.timeSaved,
            minutes: this.stats.timeSaved / 60,
            hours: this.stats.timeSaved / 3600,
            days: this.stats.timeSaved / 86400,
            formatted: this.formatTime(this.stats.timeSaved * 1000) // Convert to milliseconds
        };
    }

    formatTime(ms) {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`;
        if (ms < 86400000) return `${(ms / 3600000).toFixed(1)}h`;
        return `${(ms / 86400000).toFixed(1)}d`;
    }

    startNewSession() {
        // End current session
        const sessionEnd = Date.now();
        const sessionDuration = sessionEnd - this.sessionStart;
        
        // Record session
        this.stats.sessions++;
        
        // Start new session
        this.sessionStart = Date.now();
        this.currentSession = {
            startTime: this.sessionStart,
            operations: 0,
            characters: 0
        };
        
        return {
            previousSession: {
                duration: sessionDuration,
                operations: this.currentSession.operations,
                characters: this.currentSession.characters
            },
            newSessionStart: this.sessionStart
        };
    }

    resetStats() {
        this.stats = {
            processing: {
                totalOperations: 0,
                totalCharacters: 0,
                totalWords: 0,
                totalLines: 0,
                totalFiles: 0,
                totalTime: 0
            },
            cleaners: {},
            formats: {},
            timeSaved: 0,
            sessions: 0,
            lastReset: new Date().toISOString()
        };
        
        this.saveStats();
        
        return { success: true, message: 'Statistics reset', timestamp: this.stats.lastReset };
    }

    saveStats() {
        try {
            const data = {
                stats: this.stats,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('textcleaner_stats', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            console.error('Failed to save statistics:', error);
            return { success: false, error: error.message };
        }
    }

    loadStats() {
        try {
            const saved = localStorage.getItem('textcleaner_stats');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.stats = parsed.stats;
                return { success: true, loadedFrom: parsed.savedAt };
            }
            return { success: false, message: 'No saved statistics found' };
        } catch (error) {
            console.error('Failed to load statistics:', error);
            return { success: false, error: error.message };
        }
    }

    exportStats(format = 'json') {
        const stats = this.getStats();
        
        switch (format.toLowerCase()) {
            case 'json':
                return {
                    format: 'json',
                    data: JSON.stringify(stats, null, 2),
                    filename: `textcleaner_stats_${Date.now()}.json`
                };
                
            case 'csv':
                const csv = this.convertToCSV(stats);
                return {
                    format: 'csv',
                    data: csv,
                    filename: `textcleaner_stats_${Date.now()}.csv`
                };
                
            case 'html':
                const html = this.convertToHTML(stats);
                return {
                    format: 'html',
                    data: html,
                    filename: `textcleaner_stats_${Date.now()}.html`
                };
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    convertToCSV(stats) {
        const rows = [];
        
        // General stats
        rows.push(['Category', 'Metric', 'Value']);
        rows.push(['General', 'Total Operations', stats.processing.totalOperations]);
        rows.push(['General', 'Total Characters', stats.processing.totalCharacters]);
        rows.push(['General', 'Total Words', stats.processing.totalWords]);
        rows.push(['General', 'Total Lines', stats.processing.totalLines]);
        rows.push(['General', 'Total Files', stats.processing.totalFiles]);
        rows.push(['General', 'Total Processing Time (ms)', stats.processing.totalTime]);
        rows.push(['General', 'Time Saved (seconds)', stats.timeSaved]);
        rows.push(['General', 'Sessions', stats.sessions]);
        
        // Cleaner stats
        rows.push([]);
        rows.push(['Cleaner', 'Count', 'Characters', 'Time (ms)']);
        for (const [cleaner, data] of Object.entries(stats.cleaners)) {
            rows.push([cleaner, data.count, data.characters, data.time]);
        }
        
        // Format stats
        rows.push([]);
        rows.push(['Format', 'Count', 'Characters']);
        for (const [format, data] of Object.entries(stats.formats)) {
            rows.push([format, data.count, data.characters]);
        }
        
        return rows.map(row => row.join(',')).join('\n');
    }

    convertToHTML(stats) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>TextCleaner Pro Statistics</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .section { margin-bottom: 30px; }
        h2 { color: #333; }
    </style>
</head>
<body>
    <h1>TextCleaner Pro Statistics</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    
    <div class="section">
        <h2>General Statistics</h2>
        <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Operations</td><td>${stats.processing.totalOperations}</td></tr>
            <tr><td>Total Characters Processed</td><td>${stats.processing.totalCharacters.toLocaleString()}</td></tr>
            <tr><td>Total Words Processed</td><td>${stats.processing.totalWords.toLocaleString()}</td></tr>
            <tr><td>Total Lines Processed</td><td>${stats.processing.totalLines.toLocaleString()}</td></tr>
            <tr><td>Total Files Processed</td><td>${stats.processing.totalFiles}</td></tr>
            <tr><td>Total Processing Time</td><td>${this.formatTime(stats.processing.totalTime)}</td></tr>
            <tr><td>Estimated Time Saved</td><td>${this.formatTime(stats.timeSaved * 1000)}</td></tr>
            <tr><td>Sessions</td><td>${stats.sessions}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Cleaner Usage</h2>
        <table>
            <tr><th>Cleaner</th><th>Count</th><th>Characters</th><th>Time</th></tr>
            ${Object.entries(stats.cleaners).map(([cleaner, data]) => `
                <tr>
                    <td>${cleaner}</td>
                    <td>${data.count}</td>
                    <td>${data.characters.toLocaleString()}</td>
                    <td>${this.formatTime(data.time)}</td>
                </tr>
            `).join('')}
        </table>
    </div>
    
    <div class="section">
        <h2>Format Distribution</h2>
        <table>
            <tr><th>Format</th><th>Count</th><th>Characters</th></tr>
            ${Object.entries(stats.formats).map(([format, data]) => `
                <tr>
                    <td>${format}</td>
                    <td>${data.count}</td>
                    <td>${data.characters.toLocaleString()}</td>
                </tr>
            `).join('')}
        </table>
    </div>
</body>
</html>`;
    }

    getDailyStats() {
        // This would typically aggregate stats by day
        // For now, return current day's stats from session
        return {
            date: new Date().toISOString().split('T')[0],
            operations: this.currentSession.operations,
            characters: this.currentSession.characters,
            sessionDuration: Date.now() - this.sessionStart
        };
    }

    getLeaderboard(metric = 'characters', limit = 10) {
        const cleaners = Object.entries(this.stats.cleaners)
            .map(([id, data]) => ({
                id,
                ...data
            }))
            .sort((a, b) => b[metric] - a[metric])
            .slice(0, limit);
        
        return {
            metric,
            cleaners,
            updated: new Date().toISOString()
        };
    }
}

export default StatsTracker;