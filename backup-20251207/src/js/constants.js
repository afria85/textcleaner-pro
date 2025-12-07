/**
 * Application Constants
 * Centralized constants for the entire application
 */

export const APP_CONSTANTS = {
    // Application metadata
    APP_NAME: 'TextCleaner Pro',
    APP_VERSION: '2.0.0',
    APP_BUILD: process.env.BUILD_NUMBER || 'dev',
    
    // Feature flags
    FEATURES: {
        BATCH_PROCESSING: true,
        REAL_TIME_COLLABORATION: false,
        AI_ASSISTANT: false,
        OFFLINE_MODE: true,
        PLUGIN_SYSTEM: true,
        TEAM_WORKSPACES: true,
        API_INTEGRATION: true,
    },
    
    // Storage keys
    STORAGE_KEYS: {
        USER_PREFERENCES: 'tcp_user_prefs',
        APPLICATION_STATE: 'tcp_app_state',
        SESSION_DATA: 'tcp_session',
        CACHE: 'tcp_cache',
        HISTORY: 'tcp_history',
        PRESETS: 'tcp_presets',
        PLUGINS: 'tcp_plugins',
    },
    
    // API endpoints
    API_ENDPOINTS: {
        BASE_URL: process.env.API_URL || 'https://api.textcleaner.pro/v1',
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            REFRESH: '/auth/refresh',
            VERIFY: '/auth/verify',
            FORGOT_PASSWORD: '/auth/forgot-password',
            RESET_PASSWORD: '/auth/reset-password',
        },
        DOCUMENTS: {
            LIST: '/documents',
            CREATE: '/documents',
            GET: '/documents/:id',
            UPDATE: '/documents/:id',
            DELETE: '/documents/:id',
            SHARE: '/documents/:id/share',
            EXPORT: '/documents/:id/export',
        },
        PLUGINS: {
            LIST: '/plugins',
            INSTALL: '/plugins/install',
            UNINSTALL: '/plugins/:id',
            UPDATE: '/plugins/:id/update',
            MARKETPLACE: '/plugins/marketplace',
        },
        ANALYTICS: {
            METRICS: '/analytics/metrics',
            EVENTS: '/analytics/events',
            REPORTS: '/analytics/reports',
        },
    },
    
    // Text processing limits
    PROCESSING_LIMITS: {
        MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
        MAX_TEXT_LENGTH: 10 * 1024 * 1024, // 10MB characters
        MAX_BATCH_FILES: 100,
        MAX_HISTORY_ITEMS: 1000,
        MAX_PRESETS: 100,
        MAX_UNDO_STEPS: 50,
    },
    
    // Cleaner types
    CLEANER_TYPES: {
        GENERAL: 'general',
        CSV: 'csv',
        JSON: 'json',
        HTML: 'html',
        XML: 'xml',
        MARKDOWN: 'markdown',
        SQL: 'sql',
        LOG: 'log',
        CODE: 'code',
        SOCIAL: 'social',
        CUSTOM: 'custom',
    },
    
    // Export formats
    EXPORT_FORMATS: {
        TEXT: ['txt', 'md', 'log', 'html', 'xml'],
        DATA: ['csv', 'json', 'tsv', 'xlsx', 'xml'],
        CODE: ['js', 'ts', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php'],
    },
    
    // User roles
    USER_ROLES: {
        VIEWER: 'viewer',
        EDITOR: 'editor',
        ADMIN: 'admin',
        SUPER_ADMIN: 'super_admin',
    },
    
    // Permission levels
    PERMISSIONS: {
        READ: 'read',
        WRITE: 'write',
        DELETE: 'delete',
        SHARE: 'share',
        MANAGE: 'manage',
        ADMINISTER: 'administer',
    },
    
    // Error codes
    ERROR_CODES: {
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        AUTH_ERROR: 'AUTH_ERROR',
        PERMISSION_ERROR: 'PERMISSION_ERROR',
        NOT_FOUND: 'NOT_FOUND',
        RATE_LIMIT: 'RATE_LIMIT',
        SERVER_ERROR: 'SERVER_ERROR',
        NETWORK_ERROR: 'NETWORK_ERROR',
        STORAGE_ERROR: 'STORAGE_ERROR',
        PROCESSING_ERROR: 'PROCESSING_ERROR',
    },
    
    // UI constants
    UI: {
        BREAKPOINTS: {
            XS: 320,
            SM: 640,
            MD: 768,
            LG: 1024,
            XL: 1280,
            XXL: 1536,
        },
        Z_INDEX: {
            MODAL: 1000,
            NOTIFICATION: 900,
            DROPDOWN: 800,
            TOOLTIP: 700,
            HEADER: 600,
            SIDEBAR: 500,
        },
        ANIMATION: {
            FAST: 150,
            NORMAL: 300,
            SLOW: 500,
        },
        THEMES: ['light', 'dark', 'system'],
    },
    
    // Performance settings
    PERFORMANCE: {
        DEBOUNCE_TIME: 300,
        THROTTLE_TIME: 1000,
        CACHE_TTL: 5 * 60 * 1000, // 5 minutes
        REQUEST_TIMEOUT: 30000, // 30 seconds
        IDLE_TIMEOUT: 15 * 60 * 1000, // 15 minutes
    },
    
    // Security settings
    SECURITY: {
        PASSWORD_MIN_LENGTH: 8,
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
        TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    },
    
    // Localization
    LOCALIZATION: {
        DEFAULT_LANGUAGE: 'en',
        SUPPORTED_LANGUAGES: ['en', 'id', 'fr', 'es', 'de', 'ja', 'zh', 'ar'],
        FALLBACK_LANGUAGE: 'en',
    },
};

// Freeze constants to prevent modification
Object.freeze(APP_CONSTANTS);

// Export individual constants for easier access
export const {
    APP_NAME,
    APP_VERSION,
    FEATURES,
    STORAGE_KEYS,
    API_ENDPOINTS,
    PROCESSING_LIMITS,
    CLEANER_TYPES,
    EXPORT_FORMATS,
    USER_ROLES,
    PERMISSIONS,
    ERROR_CODES,
    UI,
    PERFORMANCE,
    SECURITY,
    LOCALIZATION,
} = APP_CONSTANTS;

// Environment detection
export const ENVIRONMENT = {
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_TEST: process.env.NODE_ENV === 'test',
    IS_CI: process.env.CI === 'true',
};

// Platform detection
export const PLATFORM = {
    IS_BROWSER: typeof window !== 'undefined',
    IS_NODE: typeof process !== 'undefined' && process.versions?.node,
    IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator?.userAgent || ''
    ),
    IS_TOUCH: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    IS_OFFLINE: !navigator.onLine,
};

// Performance constants
export const PERFORMANCE_MARKS = {
    APP_START: 'app_start',
    APP_READY: 'app_ready',
    MODULE_LOAD: 'module_load',
    PROCESS_START: 'process_start',
    PROCESS_END: 'process_end',
};

// Event names for EventBus
export const EVENTS = {
    // Application events
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',
    APP_UPDATE: 'app:update',
    
    // User events
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_UPDATE: 'user:update',
    
    // Document events
    DOCUMENT_CREATE: 'document:create',
    DOCUMENT_UPDATE: 'document:update',
    DOCUMENT_DELETE: 'document:delete',
    DOCUMENT_SAVE: 'document:save',
    DOCUMENT_EXPORT: 'document:export',
    
    // Processing events
    PROCESS_START: 'process:start',
    PROCESS_COMPLETE: 'process:complete',
    PROCESS_ERROR: 'process:error',
    PROCESS_PROGRESS: 'process:progress',
    
    // UI events
    UI_THEME_CHANGE: 'ui:theme:change',
    UI_LANGUAGE_CHANGE: 'ui:language:change',
    UI_NOTIFICATION: 'ui:notification',
    UI_MODAL_OPEN: 'ui:modal:open',
    UI_MODAL_CLOSE: 'ui:modal:close',
    
    // Storage events
    STORAGE_UPDATE: 'storage:update',
    STORAGE_ERROR: 'storage:error',
    
    // Network events
    NETWORK_ONLINE: 'network:online',
    NETWORK_OFFLINE: 'network:offline',
    NETWORK_ERROR: 'network:error',
    
    // Plugin events
    PLUGIN_INSTALL: 'plugin:install',
    PLUGIN_UNINSTALL: 'plugin:uninstall',
    PLUGIN_UPDATE: 'plugin:update',
    PLUGIN_ERROR: 'plugin:error',
};

// Cleaner configuration constants
export const CLEANER_CONFIG = {
    DEFAULT_OPTIONS: {
        trimWhitespace: true,
        removeEmptyLines: true,
        normalizeLineEndings: true,
        preserveFormatting: false,
        removeDuplicates: false,
        sortLines: false,
        caseSensitive: true,
    },
    
    CSV_OPTIONS: {
        delimiter: ',',
        hasHeader: true,
        quoteStrings: true,
        escapeQuotes: true,
        trimFields: true,
        removeEmptyRows: true,
    },
    
    JSON_OPTIONS: {
        indentSize: 2,
        sortKeys: false,
        removeNulls: false,
        minify: false,
        validate: true,
    },
    
    HTML_OPTIONS: {
        indentSize: 2,
        removeComments: false,
        removeEmptyAttributes: true,
        collapseWhitespace: false,
        quoteAttributes: true,
    },
};

// Validation patterns
export const VALIDATION_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    PHONE: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    BASE64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
};

// File constants
export const FILE_CONSTANTS = {
    MIME_TYPES: {
        TEXT: ['text/plain', 'text/markdown', 'text/html', 'text/css', 'text/javascript'],
        DATA: ['text/csv', 'application/json', 'application/xml'],
        DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    },
    
    EXTENSIONS: {
        TEXT: ['.txt', '.md', '.html', '.htm', '.css', '.js', '.json', '.xml'],
        DATA: ['.csv', '.tsv', '.json', '.xml', '.yaml', '.yml'],
        DOCUMENT: ['.pdf', '.doc', '.docx', '.odt'],
        SPREADSHEET: ['.xls', '.xlsx', '.ods'],
        CODE: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb'],
    },
    
    MAX_SIZES: {
        TEXT: 10 * 1024 * 1024, // 10MB
        IMAGE: 5 * 1024 * 1024, // 5MB
        DOCUMENT: 20 * 1024 * 1024, // 20MB
        SPREADSHEET: 10 * 1024 * 1024, // 10MB
    },
};

// Default application state
export const DEFAULT_STATE = {
    user: null,
    documents: [],
    presets: [],
    history: [],
    plugins: [],
    settings: {
        theme: 'system',
        language: 'en',
        autoSave: true,
        notifications: true,
        shortcuts: true,
        performanceMode: false,
    },
    ui: {
        sidebarOpen: true,
        currentView: 'editor',
        modal: null,
        notifications: [],
    },
};

// Export everything as a single object for backward compatibility
export default {
    APP_CONSTANTS,
    ENVIRONMENT,
    PLATFORM,
    PERFORMANCE_MARKS,
    EVENTS,
    CLEANER_CONFIG,
    VALIDATION_PATTERNS,
    FILE_CONSTANTS,
    DEFAULT_STATE,
};