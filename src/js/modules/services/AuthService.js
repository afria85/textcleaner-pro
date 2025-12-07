/**
 * Authentication Service
 * Handles user authentication, session management, and role-based access control
 * @module services/AuthService
 */

import EventEmitter from '@/js/utils/EventEmitter';
import Logger from '@/js/utils/Logger';
import Crypto from '@/js/utils/Security';
import ApiService from './ApiService';
import Storage from '@/js/modules/storage/LocalStorage';

class AuthService extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('AuthService');
        this.api = new ApiService();
        this.storage = new Storage('auth');
        this.user = null;
        this.session = null;
        this.roles = new Set();
        this.permissions = new Map();
        this.mfaEnabled = false;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.init();
    }

    /**
     * Initialize authentication service
     */
    async init() {
        try {
            // Try to restore session from storage
            await this.restoreSession();
            
            // Set up session monitoring
            this.setupSessionMonitoring();
            
            this.logger.info('Authentication service initialized');
        } catch (error) {
            this.logger.error('Failed to initialize auth service', error);
        }
    }

    /**
     * User login with credentials
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {Object} options - Login options
     * @returns {Promise<AuthResponse>}
     */
    async login(email, password, options = {}) {
        try {
            this.logger.debug('Login attempt', { email });
            
            // Validate input
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }

            if (!this.validatePassword(password)) {
                throw new Error('Password does not meet requirements');
            }

            // Hash password client-side
            const passwordHash = Crypto.hashPassword(password);
            
            // API call for authentication
            const response = await this.api.post('/auth/login', {
                email,
                password: passwordHash,
                ...options,
            });

            if (response.success) {
                await this.handleLoginSuccess(response.data);
                return {
                    success: true,
                    user: this.user,
                    session: this.session,
                    requiresMFA: response.data.requiresMFA,
                };
            } else {
                this.handleLoginFailure(response.error);
                return {
                    success: false,
                    error: response.error,
                    remainingAttempts: response.remainingAttempts,
                };
            }
        } catch (error) {
            this.logger.error('Login failed', error);
            return {
                success: false,
                error: 'Authentication failed. Please try again.',
            };
        }
    }

    /**
     * Handle successful login
     * @param {Object} data - Login response data
     */
    async handleLoginSuccess(data) {
        this.user = data.user;
        this.session = data.session;
        this.roles = new Set(data.user.roles || []);
        this.permissions = new Map(Object.entries(data.user.permissions || {}));
        this.mfaEnabled = data.user.mfaEnabled || false;

        // Store session
        await this.saveSession();
        
        // Update last login
        await this.updateLastLogin();
        
        // Emit login event
        this.emit('login', this.user);
        
        this.logger.info('User logged in successfully', { userId: this.user.id });
    }

    /**
     * User logout
     */
    async logout() {
        try {
            // Call logout API if session exists
            if (this.session?.token) {
                await this.api.post('/auth/logout', {
                    token: this.session.token,
                });
            }

            // Clear local data
            await this.clearSession();
            
            // Reset state
            this.user = null;
            this.session = null;
            this.roles.clear();
            this.permissions.clear();
            
            // Emit logout event
            this.emit('logout');
            
            this.logger.info('User logged out');
        } catch (error) {
            this.logger.error('Logout failed', error);
            // Force clear local data even if API call fails
            await this.clearSession();
        }
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     */
    async register(userData) {
        try {
            const validation = this.validateRegistration(userData);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            // Hash password
            userData.password = Crypto.hashPassword(userData.password);
            
            const response = await this.api.post('/auth/register', userData);
            
            if (response.success) {
                this.logger.info('User registered successfully', { email: userData.email });
                return {
                    success: true,
                    message: 'Registration successful. Please verify your email.',
                    userId: response.data.userId,
                };
            } else {
                return {
                    success: false,
                    errors: response.errors,
                };
            }
        } catch (error) {
            this.logger.error('Registration failed', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Verify email with token
     */
    async verifyEmail(token) {
        // Implementation
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        // Implementation
    }

    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        // Implementation
    }

    /**
     * Enable/disable MFA
     */
    async toggleMFA(enabled) {
        // Implementation
    }

    /**
     * Verify MFA code
     */
    async verifyMFA(code) {
        // Implementation
    }

    /**
     * Check if user has role
     * @param {string} role - Role to check
     * @returns {boolean}
     */
    hasRole(role) {
        return this.roles.has(role);
    }

    /**
     * Check if user has permission
     * @param {string} permission - Permission to check
     * @returns {boolean}
     */
    hasPermission(permission) {
        return this.permissions.has(permission) && this.permissions.get(permission);
    }

    /**
     * Get user's roles
     * @returns {Array<string>}
     */
    getRoles() {
        return Array.from(this.roles);
    }

    /**
     * Get user's permissions
     * @returns {Object}
     */
    getPermissions() {
        return Object.fromEntries(this.permissions);
    }

    /**
     * Validate email format
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     */
    validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    }

    /**
     * Validate registration data
     */
    validateRegistration(userData) {
        const errors = [];
        
        if (!this.validateEmail(userData.email)) {
            errors.push('Invalid email format');
        }
        
        if (!this.validatePassword(userData.password)) {
            errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
        }
        
        if (userData.password !== userData.confirmPassword) {
            errors.push('Passwords do not match');
        }
        
        if (!userData.name || userData.name.length < 2) {
            errors.push('Name must be at least 2 characters');
        }
        
        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Save session to storage
     */
    async saveSession() {
        try {
            await this.storage.set('session', {
                user: this.user,
                session: this.session,
                roles: Array.from(this.roles),
                permissions: Object.fromEntries(this.permissions),
                timestamp: Date.now(),
            });
        } catch (error) {
            this.logger.error('Failed to save session', error);
        }
    }

    /**
     * Restore session from storage
     */
    async restoreSession() {
        try {
            const savedSession = await this.storage.get('session');
            
            if (savedSession && this.isSessionValid(savedSession)) {
                this.user = savedSession.user;
                this.session = savedSession.session;
                this.roles = new Set(savedSession.roles || []);
                this.permissions = new Map(Object.entries(savedSession.permissions || {}));
                
                // Refresh token if needed
                if (this.isTokenExpiring()) {
                    await this.refreshToken();
                }
                
                this.logger.debug('Session restored');
                return true;
            }
        } catch (error) {
            this.logger.error('Failed to restore session', error);
        }
        return false;
    }

    /**
     * Clear session from storage
     */
    async clearSession() {
        try {
            await this.storage.remove('session');
            await this.storage.remove('auth_token');
            await this.storage.remove('user_data');
        } catch (error) {
            this.logger.error('Failed to clear session', error);
        }
    }

    /**
     * Check if session is valid
     */
    isSessionValid(savedSession) {
        if (!savedSession || !savedSession.timestamp) {
            return false;
        }
        
        const sessionAge = Date.now() - savedSession.timestamp;
        return sessionAge < this.sessionTimeout;
    }

    /**
     * Check if token is expiring soon
     */
    isTokenExpiring() {
        if (!this.session?.expiresAt) {
            return false;
        }
        
        const expiresAt = new Date(this.session.expiresAt).getTime();
        const now = Date.now();
        const buffer = 5 * 60 * 1000; // 5 minutes
        
        return (expiresAt - now) < buffer;
    }

    /**
     * Refresh authentication token
     */
    async refreshToken() {
        try {
            const response = await this.api.post('/auth/refresh', {
                refreshToken: this.session.refreshToken,
            });
            
            if (response.success) {
                this.session = response.data.session;
                await this.saveSession();
                this.logger.debug('Token refreshed');
            }
        } catch (error) {
            this.logger.error('Failed to refresh token', error);
            await this.logout();
        }
    }

    /**
     * Update last login timestamp
     */
    async updateLastLogin() {
        try {
            await this.api.post('/auth/last-login', {
                userId: this.user.id,
                timestamp: Date.now(),
            });
        } catch (error) {
            // Non-critical error, just log it
            this.logger.warn('Failed to update last login', error);
        }
    }

    /**
     * Set up session monitoring
     */
    setupSessionMonitoring() {
        // Check session periodically
        this.sessionInterval = setInterval(() => {
            if (this.isTokenExpiring()) {
                this.refreshToken();
            }
        }, 60000); // Check every minute

        // Listen for storage events (other tabs)
        window.addEventListener('storage', (event) => {
            if (event.key === 'session') {
                this.handleStorageChange(event);
            }
        });

        // Listen for visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkSession();
            }
        });
    }

    /**
     * Handle storage change events
     */
    handleStorageChange(event) {
        if (!event.newValue) {
            // Session was cleared in another tab
            this.logout();
        }
    }

    /**
     * Check session status
     */
    async checkSession() {
        try {
            if (this.session?.token) {
                const response = await this.api.get('/auth/validate');
                if (!response.valid) {
                    await this.logout();
                }
            }
        } catch (error) {
            this.logger.warn('Session check failed', error);
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.user && !!this.session;
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.hasRole('admin') || this.hasRole('superadmin');
    }

    /**
     * Handle login failure
     */
    handleLoginFailure(error) {
        // Track failed attempts
        this.trackFailedAttempt();
        
        // Log the failure
        this.logger.warn('Login failed', { error });
        
        // Emit failure event
        this.emit('login:failure', error);
    }

    /**
     * Track failed login attempts
     */
    trackFailedAttempt() {
        const attempts = parseInt(this.storage.get('failed_attempts') || '0');
        this.storage.set('failed_attempts', attempts + 1);
        
        // Lock account after 5 failed attempts
        if (attempts >= 5) {
            this.storage.set('account_locked', Date.now());
            this.emit('account:locked');
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
        }
        this.removeAllListeners();
    }
}

export default AuthService;