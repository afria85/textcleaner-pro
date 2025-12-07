/**
 * Application Configuration
 * 
 * @fileoverview Centralized configuration management with environment
 * detection, validation, and type safety.
 * 
 * @version 2.0.0
 * @license MIT
 */

/**
 * @typedef {Object} AppConfig
 * @property {Object} app - Application metadata
 * @property {Object} processing - Text processing configuration
 * @property {Object} ui - User interface configuration
 * @property {Object} storage - Storage configuration
 * @property {Object} api - API configuration
 * @property {Object} features - Feature flags
 * @property {Object} security - Security configuration
 * @property {Object} analytics - Analytics configuration
 * @property {Object} performance - Performance configuration
 * @property {Object} errors - Error messages
 * @property {Object} messages - Success messages
 */

/**
 * Environment detection
 */
const ENVIRONMENT = (() => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isDevelopment = isLocalhost || hostname.includes('.local');
  const isStaging = hostname.includes('staging') || hostname.includes('test');
  const isProduction = !isDevelopment && !isStaging;

  return {
    IS_DEVELOPMENT: isDevelopment,
    IS_STAGING: isStaging,
    IS_PRODUCTION: isProduction,
    HOSTNAME: hostname,
    PROTOCOL: window.location.protocol,
    PORT: window.location.port || (window.location.protocol === 'https:' ? '443' : '80')
  };
})();

/**
 * Build information (injected during build process)
 */
const BUILD_INFO = {
  VERSION: process.env.APP_VERSION || '2.0.0',
  BUILD_ID: process.env.BUILD_ID || `dev-${Date.now()}`,
  BUILD_TIMESTAMP: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
  COMMIT_HASH: process.env.COMMIT_HASH || 'dev',
  BRANCH: process.env.BRANCH || 'development'
};

/**
 * Platform detection
 */
const PLATFORM = (() => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(userAgent);
  const isDesktop = !isMobile && !isTouch;
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !isChrome;
  const isEdge = /Edg/.test(userAgent);

  return {
    IS_MOBILE: isMobile,
    IS_TOUCH: isTouch,
    IS_IOS: isIOS,
    IS_ANDROID: isAndroid,
    IS_DESKTOP: isDesktop,
    BROWSER: {
      CHROME: isChrome,
      FIREFOX: isFirefox,
      SAFARI: isSafari,
      EDGE: isEdge
    },
    USER_AGENT: userAgent
  };
})();

/**
 * Feature flags with environment-specific overrides
 */
const FEATURE_FLAGS = {
  // Core features (always enabled)
  BATCH_PROCESSING: true,
  FILE_UPLOAD: true,
  EXPORT_OPTIONS: true,
  HISTORY: true,
  PRESETS: true,

  // Development-only features
  DEBUG_TOOLS: ENVIRONMENT.IS_DEVELOPMENT,
  PERFORMANCE_MONITORING: ENVIRONMENT.IS_DEVELOPMENT || ENVIRONMENT.IS_STAGING,
  HOT_RELOAD: ENVIRONMENT.IS_DEVELOPMENT,

  // Experimental features (disabled by default)
  AI_ASSISTANT: false,
  REAL_TIME_COLLABORATION: false,
  PLUGIN_SYSTEM: false,
  CLOUD_SYNC: false,

  // Environment-specific features
  ANALYTICS: ENVIRONMENT.IS_PRODUCTION,
  ERROR_REPORTING: ENVIRONMENT.IS_PRODUCTION,
  SERVICE_WORKER: ENVIRONMENT.IS_PRODUCTION || ENVIRONMENT.IS_STAGING,
  OFFLINE_MODE: ENVIRONMENT.IS_PRODUCTION || ENVIRONMENT.IS_STAGING
};

/**
 * Main configuration object
 * @type {AppConfig}
 */
const CONFIG = Object.freeze({
  // Application metadata
  APP: Object.freeze({
    NAME: 'TextCleaner Pro',
    VERSION: BUILD_INFO.VERSION,
    BUILD_ID: BUILD_INFO.BUILD_ID,
    BUILD_TIMESTAMP: BUILD_INFO.BUILD_TIMESTAMP,
    COMMIT_HASH: BUILD_INFO.COMMIT_HASH,
    BRANCH: BUILD_INFO.BRANCH,
    ENVIRONMENT: ENVIRONMENT.IS_PRODUCTION ? 'production' : 
                 ENVIRONMENT.IS_STAGING ? 'staging' : 'development',
    SUPPORT_EMAIL: 'support@textcleaner.pro',
    PRIVACY_POLICY_URL: 'https://textcleaner.pro/privacy',
    TERMS_URL: 'https://textcleaner.pro/terms',
    DOCS_URL: 'https://docs.textcleaner.pro'
  }),

  // Text processing configuration
  PROCESSING: Object.freeze({
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_TEXT_LENGTH: 10 * 1024 * 1024, // 10MB characters
    MAX_BATCH_FILES: 100,
    TIMEOUT: 30000, // 30 seconds
    CHUNK_SIZE: 10000, // Characters per chunk
    MAX_UNDO_STEPS: 50,
    MAX_HISTORY_ITEMS: 1000,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    DEFAULT_CLEANER: 'general',
    SUPPORTED_FORMATS: ['txt', 'csv', 'json', 'xml', 'html', 'md', 'log', 'sql', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb']
  }),

  // User interface configuration
  UI: Object.freeze({
    THEME: 'auto', // auto, light, dark
    FONT_SIZE: 'medium', // small, medium, large
    EDITOR_THEME: 'default',
    SHOW_LINE_NUMBERS: true,
    WORD_WRAP: true,
    AUTO_COMPLETE: true,
    SYNTAX_HIGHLIGHTING: true,
    ANIMATIONS: true,
    REDUCED_MOTION: false,
    LANGUAGE: 'en',
    TIMEZONE: Intl.DateTimeFormat().resolvedOptions().timeZone,
    DATE_FORMAT: 'YYYY-MM-DD',
    TIME_FORMAT: 'HH:mm'
  }),

  // Storage configuration
  STORAGE: Object.freeze({
    PREFIX: 'tcp_',
    VERSION: '2.0',
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    BACKUP_INTERVAL: 300000, // 5 minutes
    AUTO_SYNC: true,
    SYNC_INTERVAL: 60000, // 1 minute
    ENCRYPTION: {
      ENABLED: true,
      ALGORITHM: 'AES-GCM',
      KEY_LENGTH: 256
    }
  }),

  // API configuration
  API: Object.freeze({
    BASE_URL: ENVIRONMENT.IS_PRODUCTION 
      ? 'https://api.textcleaner.pro/v1'
      : ENVIRONMENT.IS_STAGING
        ? 'https://staging-api.textcleaner.pro/v1'
        : 'http://localhost:3000/api/v1',
    
    ENDPOINTS: Object.freeze({
      AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        REGISTER: '/auth/register',
        VERIFY: '/auth/verify',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password'
      },
      PROCESSING: {
        CLEAN: '/process/clean',
        BATCH: '/process/batch',
        VALIDATE: '/process/validate',
        FORMAT_DETECT: '/process/detect-format'
      },
      EXPORT: {
        DOWNLOAD: '/export/download',
        EMAIL: '/export/email',
        CLOUD: '/export/cloud'
      },
      ANALYTICS: {
        METRICS: '/analytics/metrics',
        EVENTS: '/analytics/events',
        REPORTS: '/analytics/reports'
      }
    }),

    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    REQUEST_DEBOUNCE: 300
  }),

  // Feature flags
  FEATURES: Object.freeze(FEATURE_FLAGS),

  // Security configuration
  SECURITY: Object.freeze({
    PASSWORD: {
      MIN_LENGTH: 8,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SYMBOLS: false
    },
    SESSION: {
      TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
      REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
      MAX_CONCURRENT: 5
    },
    RATE_LIMITING: {
      ENABLED: true,
      REQUESTS_PER_MINUTE: 60,
      BURST_SIZE: 10
    },
    ENCRYPTION: {
      ENABLED: true,
      ALGORITHM: 'AES-GCM',
      KEY_ROTATION_INTERVAL: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }),

  // Analytics configuration
  ANALYTICS: Object.freeze({
    ENABLED: FEATURE_FLAGS.ANALYTICS,
    PROVIDERS: {
      GOOGLE_ANALYTICS: ENVIRONMENT.IS_PRODUCTION ? 'UA-XXXXXXXXX-X' : '',
      SENTRY: ENVIRONMENT.IS_PRODUCTION ? 'https://xxxxxxxxxxxxxxxxx.ingest.sentry.io/xxxxxxx' : '',
      AMPLITUDE: ENVIRONMENT.IS_PRODUCTION ? 'xxxxxxxxxxxxxxxxxxxxxxxx' : ''
    },
    AUTO_TRACK: true,
    PRIVACY_MODE: false,
    ANONYMIZE_IP: true,
    SAMPLE_RATE: ENVIRONMENT.IS_PRODUCTION ? 0.1 : 1.0
  }),

  // Performance configuration
  PERFORMANCE: Object.freeze({
    DEBOUNCE_TIME: 300,
    THROTTLE_TIME: 1000,
    CACHE_SIZE: 100,
    LAZY_LOAD_THRESHOLD: 10000,
    WEB_WORKER_ENABLED: true,
    MEMORY_WARNING_THRESHOLD: 0.8, // 80% memory usage
    LONG_TASK_THRESHOLD: 50 // 50ms
  }),

  // Error messages
  ERRORS: Object.freeze({
    VALIDATION: {
      REQUIRED: 'This field is required',
      INVALID_EMAIL: 'Please enter a valid email address',
      INVALID_URL: 'Please enter a valid URL',
      INVALID_FORMAT: 'Invalid format',
      TOO_SHORT: 'Value is too short',
      TOO_LONG: 'Value is too long',
      PATTERN_MISMATCH: 'Value does not match required pattern'
    },
    PROCESSING: {
      FILE_TOO_LARGE: 'File size exceeds maximum limit (50MB)',
      INVALID_FORMAT: 'Unsupported file format',
      PROCESSING_FAILED: 'Failed to process text',
      TIMEOUT: 'Processing timeout. Please try again.',
      MEMORY_EXCEEDED: 'Insufficient memory to process this file'
    },
    NETWORK: {
      OFFLINE: 'You are offline. Please check your connection.',
      TIMEOUT: 'Request timeout. Please try again.',
      SERVER_ERROR: 'Server error occurred. Please try again later.',
      FORBIDDEN: 'You do not have permission to perform this action',
      NOT_FOUND: 'Resource not found'
    },
    STORAGE: {
      FULL: 'Storage limit reached. Please clear some data.',
      CORRUPTED: 'Storage data is corrupted. Clearing storage...',
      UNAVAILABLE: 'Storage is not available. Using fallback.'
    }
  }),

  // Success messages
  MESSAGES: Object.freeze({
    PROCESSING: {
      SUCCESS: 'Text processed successfully',
      BATCH_SUCCESS: 'Batch processing completed successfully'
    },
    EXPORT: {
      SUCCESS: 'File exported successfully',
      COPIED: 'Copied to clipboard'
    },
    SAVE: {
      SUCCESS: 'Settings saved successfully',
      PRESET_SAVED: 'Preset saved successfully'
    },
    GENERAL: {
      WELCOME: 'Welcome to TextCleaner Pro!',
      READY: 'Application is ready'
    }
  }),

  // Cleaner-specific configurations
  CLEANERS: Object.freeze({
    GENERAL: {
      TRIM_WHITESPACE: true,
      REMOVE_EMPTY_LINES: true,
      NORMALIZE_LINE_ENDINGS: true,
      REMOVE_EXTRA_SPACES: true,
      PRESERVE_FORMATTING: false
    },
    CSV: {
      DELIMITER: ',',
      HAS_HEADER: true,
      QUOTE_STRINGS: true,
      ESCAPE_QUOTES: true,
      TRIM_FIELDS: true,
      REMOVE_EMPTY_ROWS: true
    },
    JSON: {
      INDENT_SIZE: 2,
      SORT_KEYS: false,
      REMOVE_NULLS: false,
      MINIFY: false,
      VALIDATE: true
    },
    HTML: {
      INDENT_SIZE: 2,
      REMOVE_COMMENTS: false,
      REMOVE_EMPTY_ATTRIBUTES: true,
      COLLAPSE_WHITESPACE: false,
      QUOTE_ATTRIBUTES: true
    }
  })
});

/**
 * Configuration validator
 * @class ConfigValidator
 */
class ConfigValidator {
  /**
   * Validate configuration
   * @static
   * @returns {Array<string>} Validation errors
   */
  static validate() {
    const errors = [];

    // Validate required fields
    if (!CONFIG.APP.NAME) errors.push('App name is required');
    if (!CONFIG.APP.VERSION) errors.push('App version is required');
    if (!CONFIG.APP.SUPPORT_EMAIL) errors.push('Support email is required');

    // Validate processing limits
    if (CONFIG.PROCESSING.MAX_FILE_SIZE <= 0) {
      errors.push('Max file size must be positive');
    }

    if (CONFIG.PROCESSING.MAX_TEXT_LENGTH <= 0) {
      errors.push('Max text length must be positive');
    }

    if (CONFIG.PROCESSING.TIMEOUT <= 0) {
      errors.push('Timeout must be positive');
    }

    // Validate storage limits
    if (CONFIG.STORAGE.MAX_SIZE <= 0) {
      errors.push('Storage max size must be positive');
    }

    // Validate security settings
    if (CONFIG.SECURITY.PASSWORD.MIN_LENGTH < 6) {
      errors.push('Password minimum length must be at least 6');
    }

    // Validate API configuration
    if (!CONFIG.API.BASE_URL) {
      errors.push('API base URL is required');
    }

    return errors;
  }

  /**
   * Get configuration for environment
   * @static
   * @returns {AppConfig}
   */
  static getConfigForEnvironment() {
    // Clone config
    const config = JSON.parse(JSON.stringify(CONFIG));

    // Apply environment-specific overrides
    if (ENVIRONMENT.IS_DEVELOPMENT) {
      config.APP.ENVIRONMENT = 'development';
      config.API.BASE_URL = 'http://localhost:3000/api/v1';
      config.FEATURES.DEBUG_TOOLS = true;
      config.FEATURES.PERFORMANCE_MONITORING = true;
    } else if (ENVIRONMENT.IS_STAGING) {
      config.APP.ENVIRONMENT = 'staging';
      config.API.BASE_URL = 'https://staging-api.textcleaner.pro/v1';
    }

    return Object.freeze(config);
  }
}

// Validate configuration on load
const validationErrors = ConfigValidator.validate();
if (validationErrors.length > 0) {
  console.error('Configuration validation failed:', validationErrors);
  
  if (ENVIRONMENT.IS_PRODUCTION) {
    throw new Error(`Configuration validation failed: ${validationErrors.join(', ')}`);
  }
}

// Export configuration
export default CONFIG;

// Export environment and platform info
export {
  ENVIRONMENT,
  PLATFORM,
  BUILD_INFO,
  ConfigValidator
};

// Export utility functions
export const getConfig = () => CONFIG;
export const getEnvironment = () => ENVIRONMENT;
export const getPlatform = () => PLATFORM;
export const getBuildInfo = () => BUILD_INFO;
export const isFeatureEnabled = (feature) => CONFIG.FEATURES[feature] === true;

// Configuration change listeners (for development)
const configListeners = new Set();
export const subscribeToConfigChanges = (listener) => {
  configListeners.add(listener);
  return () => configListeners.delete(listener);
};

// Configuration update (development only)
if (ENVIRONMENT.IS_DEVELOPMENT) {
  window.__TEXT_CLEANER_CONFIG = CONFIG;
  window.__TEXT_CLEANER_ENV = ENVIRONMENT;
  window.__TEXT_CLEANER_PLATFORM = PLATFORM;
}