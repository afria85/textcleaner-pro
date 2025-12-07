/**
 * Session Manager - User session management
 */

class SessionManager {
    constructor() {
        this.sessionId = null;
        this.sessionData = {};
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.inactivityTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastActivity = Date.now();
        this.init();
    }

    init() {
        this.loadSession();
        this.setupActivityTracking();
        this.setupAutoSave();
    }

    loadSession() {
        try {
            // Try to load existing session
            const savedSession = localStorage.getItem('tcp_session');
            if (savedSession) {
                const session = JSON.parse(savedSession);
                
                // Check if session is expired
                if (session.expires > Date.now()) {
                    this.sessionId = session.id;
                    this.sessionData = session.data || {};
                    this.lastActivity = session.lastActivity;
                    
                    console.log('Session restored:', this.sessionId);
                    return true;
                } else {
                    console.log('Session expired, creating new one');
                }
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
        
        // Create new session
        return this.createNewSession();
    }

    createNewSession() {
        this.sessionId = this.generateSessionId();
        this.sessionData = {
            created: Date.now(),
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        this.lastActivity = Date.now();
        
        this.saveSession();
        console.log('New session created:', this.sessionId);
        return true;
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    saveSession() {
        try {
            const session = {
                id: this.sessionId,
                data: this.sessionData,
                lastActivity: this.lastActivity,
                expires: Date.now() + this.sessionTimeout,
                created: this.sessionData.created
            };
            
            localStorage.setItem('tcp_session', JSON.stringify(session));
            return true;
        } catch (error) {
            console.error('Failed to save session:', error);
            return false;
        }
    }

    setupActivityTracking() {
        // Track user activity
        const activities = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        
        const updateActivity = () => {
            this.lastActivity = Date.now();
            this.saveSession();
        };
        
        activities.forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });
        
        // Check for inactivity
        setInterval(() => {
            const inactiveTime = Date.now() - this.lastActivity;
            if (inactiveTime > this.inactivityTimeout) {
                this.onInactivity();
            }
        }, 60000); // Check every minute
    }

    onInactivity() {
        console.log('User inactive for', this.inactivityTimeout / 60000, 'minutes');
        // Could trigger auto-save, notifications, etc.
    }

    setupAutoSave() {
        // Auto-save session data periodically
        setInterval(() => {
            if (Object.keys(this.sessionData).length > 0) {
                this.saveSession();
            }
        }, 30000); // Every 30 seconds
    }

    set(key, value) {
        this.sessionData[key] = value;
        this.lastActivity = Date.now();
        this.saveSession();
        
        // Dispatch event for other components
        this.dispatchEvent('sessionDataChanged', { key, value });
        
        return { success: true, key, sessionId: this.sessionId };
    }

    get(key, defaultValue = null) {
        return this.sessionData[key] !== undefined ? this.sessionData[key] : defaultValue;
    }

    remove(key) {
        const value = this.sessionData[key];
        delete this.sessionData[key];
        this.saveSession();
        
        this.dispatchEvent('sessionDataRemoved', { key, value });
        
        return { success: true, key, value };
    }

    getAll() {
        return { ...this.sessionData };
    }

    clear() {
        const oldData = { ...this.sessionData };
        this.sessionData = {};
        this.saveSession();
        
        this.dispatchEvent('sessionCleared', { oldData });
        
        return { success: true, cleared: oldData };
    }

    getSessionInfo() {
        return {
            id: this.sessionId,
            created: new Date(this.sessionData.created).toLocaleString(),
            duration: Date.now() - this.sessionData.created,
            lastActivity: new Date(this.lastActivity).toLocaleString(),
            inactiveTime: Date.now() - this.lastActivity,
            dataCount: Object.keys(this.sessionData).length,
            expiresIn: (this.sessionData.created + this.sessionTimeout) - Date.now()
        };
    }

    extendSession(duration = this.sessionTimeout) {
        this.sessionTimeout = duration;
        this.saveSession();
        
        return {
            success: true,
            newTimeout: duration,
            expiresAt: Date.now() + duration
        };
    }

    endSession() {
        const sessionInfo = this.getSessionInfo();
        this.sessionId = null;
        this.sessionData = {};
        localStorage.removeItem('tcp_session');
        
        this.dispatchEvent('sessionEnded', { sessionInfo });
        
        return { success: true, endedSession: sessionInfo };
    }

    // Event system
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(`session:${eventName}`, { detail });
        window.dispatchEvent(event);
    }

    on(eventName, callback) {
        const handler = (event) => {
            if (event.detail) {
                callback(event.detail);
            }
        };
        
        window.addEventListener(`session:${eventName}`, handler);
        
        // Return unsubscribe function
        return () => window.removeEventListener(`session:${eventName}`, handler);
    }

    // Session analytics
    trackEvent(eventName, properties = {}) {
        if (!this.sessionData.events) {
            this.sessionData.events = [];
        }
        
        const event = {
            name: eventName,
            properties,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };
        
        this.sessionData.events.push(event);
        
        // Keep only last 100 events
        if (this.sessionData.events.length > 100) {
            this.sessionData.events = this.sessionData.events.slice(-100);
        }
        
        this.saveSession();
        
        return { success: true, event };
    }

    getEvents(filter = {}) {
        const events = this.sessionData.events || [];
        
        if (filter.name) {
            return events.filter(event => event.name === filter.name);
        }
        
        if (filter.startDate) {
            return events.filter(event => event.timestamp >= filter.startDate);
        }
        
        if (filter.endDate) {
            return events.filter(event => event.timestamp <= filter.endDate);
        }
        
        return events;
    }

    // User preferences
    setPreference(key, value) {
        if (!this.sessionData.preferences) {
            this.sessionData.preferences = {};
        }
        
        this.sessionData.preferences[key] = value;
        this.saveSession();
        
        this.dispatchEvent('preferenceChanged', { key, value });
        
        return { success: true, key, value };
    }

    getPreference(key, defaultValue = null) {
        if (!this.sessionData.preferences) {
            return defaultValue;
        }
        
        return this.sessionData.preferences[key] !== undefined ? 
            this.sessionData.preferences[key] : defaultValue;
    }

    getAllPreferences() {
        return { ...(this.sessionData.preferences || {}) };
    }

    // Temporary data (cleared on session end)
    setTemp(key, value, ttl = 3600000) { // 1 hour default
        if (!this.sessionData.temp) {
            this.sessionData.temp = {};
        }
        
        this.sessionData.temp[key] = {
            value,
            expires: Date.now() + ttl
        };
        
        this.saveSession();
        
        return { success: true, key, expiresIn: ttl };
    }

    getTemp(key, defaultValue = null) {
        if (!this.sessionData.temp || !this.sessionData.temp[key]) {
            return defaultValue;
        }
        
        const item = this.sessionData.temp[key];
        
        if (item.expires < Date.now()) {
            delete this.sessionData.temp[key];
            this.saveSession();
            return defaultValue;
        }
        
        return item.value;
    }

    // Session backup and restore
    backupSession() {
        return {
            sessionId: this.sessionId,
            data: this.sessionData,
            lastActivity: this.lastActivity,
            timestamp: Date.now()
        };
    }

    restoreSession(backup) {
        if (!backup || !backup.sessionId || !backup.data) {
            return { success: false, error: 'Invalid backup data' };
        }
        
        this.sessionId = backup.sessionId;
        this.sessionData = backup.data;
        this.lastActivity = backup.lastActivity || Date.now();
        
        this.saveSession();
        
        return { success: true, sessionId: this.sessionId };
    }
}

export default SessionManager;