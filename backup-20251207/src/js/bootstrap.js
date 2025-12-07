/**
 * TextCleaner Pro - Application Bootstrap
 * 
 * @fileoverview Main application entry point with error boundary,
 * service worker registration, and initialization sequence.
 * 
 * @version 2.0.0
 * @license MIT
 */

// Polyfills for older browsers
import './polyfills.js';

// Core modules
import App from './modules/core/App.js';
import Logger from './modules/utils/Logger.js';
import ErrorHandler from './modules/utils/ErrorHandler.js';
import PerformanceMonitor from './modules/utils/PerformanceMonitor.js';

// Configuration
import config from './config.js';

/**
 * Application Bootstrap Class
 * @class ApplicationBootstrap
 */
class ApplicationBootstrap {
  constructor() {
    this.app = null;
    this.logger = new Logger('Bootstrap');
    this.errorHandler = new ErrorHandler();
    this.performance = new PerformanceMonitor();
    this.isInitialized = false;
    this.serviceWorkerRegistration = null;
    
    // Bind methods
    this.handleUnhandledError = this.handleUnhandledError.bind(this);
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
  }

  /**
   * Initialize the application
   * @async
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      this.logger.warn('Application already initialized');
      return;
    }

    this.performance.mark('app:init:start');

    try {
      this.logger.info('Starting application initialization...', {
        version: config.APP_VERSION,
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString()
      });

      // Setup error handling first
      this.setupErrorHandling();

      // Register service worker for PWA
      await this.registerServiceWorker();

      // Initialize core application
      this.app = new App();
      await this.app.initialize();

      // Mount application to DOM
      this.mountApplication();

      // Track performance
      this.performance.mark('app:init:end');
      this.performance.measure(
        'app:initialization',
        'app:init:start',
        'app:init:end'
      );

      this.isInitialized = true;

      this.logger.info('Application initialized successfully', {
        initializationTime: this.performance.getMeasurement('app:initialization')?.duration,
        memoryUsage: performance.memory ? {
          usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        } : 'N/A'
      });

      // Dispatch ready event
      this.dispatchReadyEvent();

    } catch (error) {
      this.logger.error('Application initialization failed', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      this.handleFatalError(error);
      throw error;
    }
  }

  /**
   * Setup global error handling
   * @private
   */
  setupErrorHandling() {
    // Window error events
    window.addEventListener('error', this.handleUnhandledError);

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Network status
    window.addEventListener('online', () => {
      this.logger.info('Application is online');
      this.app?.dispatchEvent('network:online');
    });

    window.addEventListener('offline', () => {
      this.logger.warn('Application is offline');
      this.app?.dispatchEvent('network:offline');
    });

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.app?.dispatchEvent('app:background');
      } else {
        this.app?.dispatchEvent('app:foreground');
      }
    });

    // Log uncaught errors in console
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.logger.error('Console error', { args });
      originalConsoleError.apply(console, args);
    };

    this.logger.debug('Error handling setup completed');
  }

  /**
   * Handle unhandled errors
   * @private
   * @param {ErrorEvent} event
   */
  handleUnhandledError(event) {
    const errorDetails = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.toString(),
      stack: event.error?.stack,
      timestamp: new Date().toISOString()
    };

    this.logger.error('Unhandled error occurred', errorDetails);

    // Report to error tracking service
    this.errorHandler.report(errorDetails);

    // Prevent default browser error handling for certain errors
    if (event.error?.name === 'ChunkLoadError') {
      event.preventDefault();
      this.handleChunkLoadError(event.error);
    }
  }

  /**
   * Handle unhandled promise rejections
   * @private
   * @param {PromiseRejectionEvent} event
   */
  handleUnhandledRejection(event) {
    const errorDetails = {
      reason: event.reason?.toString(),
      promise: event.promise,
      timestamp: new Date().toISOString()
    };

    this.logger.error('Unhandled promise rejection', errorDetails);
    this.errorHandler.report(errorDetails);
  }

  /**
   * Handle chunk load errors (code splitting)
   * @private
   * @param {Error} error
   */
  handleChunkLoadError(error) {
    this.logger.warn('Chunk load error detected, attempting recovery...');

    // Clear module cache and retry
    if (window.location.hash !== '#retry') {
      window.location.hash = '#retry';
      window.location.reload();
    } else {
      this.showErrorUI('Failed to load application resources. Please clear cache and try again.');
    }
  }

  /**
   * Register service worker for PWA
   * @private
   * @async
   * @returns {Promise<ServiceWorkerRegistration|null>}
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      this.logger.warn('Service workers are not supported');
      return null;
    }

    if (config.NODE_ENV === 'development' && !config.ENABLE_SW_IN_DEV) {
      this.logger.info('Service worker disabled in development mode');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      this.serviceWorkerRegistration = registration;

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateNotification();
          }
        });
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.logger.info('Service worker controller changed');
      });

      this.logger.info('Service worker registered successfully', {
        scope: registration.scope,
        active: !!registration.active,
        waiting: !!registration.waiting,
        installing: !!registration.installing
      });

      return registration;

    } catch (error) {
      this.logger.error('Service worker registration failed', {
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Show update notification
   * @private
   */
  showUpdateNotification() {
    if (!this.app) return;

    this.app.showNotification({
      type: 'info',
      title: 'Update Available',
      message: 'A new version is available. Refresh to update.',
      actions: [
        {
          label: 'Refresh',
          handler: () => window.location.reload()
        },
        {
          label: 'Later',
          handler: () => {}
        }
      ],
      duration: 0 // Don't auto-dismiss
    });
  }

  /**
   * Mount application to DOM
   * @private
   */
  mountApplication() {
    const appContainer = document.getElementById('app');
    
    if (!appContainer) {
      throw new Error('Application container (#app) not found in DOM');
    }

    // Clear loading state
    appContainer.innerHTML = '';
    
    // Render application
    this.app.render(appContainer);

    this.logger.debug('Application mounted to DOM');
  }

  /**
   * Dispatch application ready event
   * @private
   */
  dispatchReadyEvent() {
    const event = new CustomEvent('app:ready', {
      detail: {
        timestamp: new Date().toISOString(),
        version: config.APP_VERSION,
        build: config.BUILD_ID,
        performance: {
          initialization: this.performance.getMeasurement('app:initialization')?.duration
        }
      },
      bubbles: true,
      cancelable: false
    });

    document.dispatchEvent(event);
    window.dispatchEvent(event);

    this.logger.debug('Application ready event dispatched');
  }

  /**
   * Handle fatal errors
   * @private
   * @param {Error} error
   */
  handleFatalError(error) {
    // Remove existing app container
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.innerHTML = '';
    }

    // Create error UI
    const errorHTML = `
      <div class="fatal-error">
        <div class="error-container">
          <div class="error-icon">??</div>
          <h1>Application Error</h1>
          <p class="error-message">Sorry, we encountered an error while starting the application.</p>
          <div class="error-details">
            <code>${error.message || 'Unknown error'}</code>
          </div>
          <div class="error-actions">
            <button onclick="window.location.reload()" class="btn btn-primary">
              Retry
            </button>
            <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload()" class="btn btn-secondary">
              Clear Data & Retry
            </button>
            <button onclick="window.location.href = '/'">
              Go Home
            </button>
          </div>
          <div class="error-support">
            <p>If the problem persists, please contact support.</p>
            <a href="mailto:support@textcleaner.pro">support@textcleaner.pro</a>
          </div>
        </div>
      </div>
    `;

    // Add error styles
    const errorStyles = `
      <style>
        .fatal-error {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .error-container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
        }
        .error-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .error-container h1 {
          color: #e53e3e;
          margin-bottom: 16px;
          font-size: 28px;
        }
        .error-message {
          color: #4a5568;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .error-details {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: left;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
          color: #c53030;
          max-height: 200px;
          overflow: auto;
        }
        .error-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }
        .btn-primary {
          background: #4299e1;
          color: white;
        }
        .btn-primary:hover {
          background: #3182ce;
        }
        .btn-secondary {
          background: #fed7d7;
          color: #c53030;
        }
        .btn-secondary:hover {
          background: #fc8181;
          color: white;
        }
        .error-support {
          border-top: 1px solid #e2e8f0;
          padding-top: 24px;
          color: #718096;
          font-size: 14px;
        }
        .error-support a {
          color: #4299e1;
          text-decoration: none;
        }
        .error-support a:hover {
          text-decoration: underline;
        }
        @media (max-width: 640px) {
          .error-container {
            padding: 24px;
          }
          .error-actions {
            flex-direction: column;
          }
          .btn {
            width: 100%;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', errorStyles);
    document.body.innerHTML = errorHTML;
  }

  /**
   * Get application instance
   * @returns {App|null}
   */
  getApp() {
    return this.app;
  }

  /**
   * Check if application is initialized
   * @returns {boolean}
   */
  isAppInitialized() {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   * @async
   */
  async destroy() {
    if (this.app) {
      await this.app.destroy();
    }

    // Remove event listeners
    window.removeEventListener('error', this.handleUnhandledError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Unregister service worker
    if (this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.unregister();
      } catch (error) {
        this.logger.error('Failed to unregister service worker', { error: error.message });
      }
    }

    this.logger.info('Application bootstrap destroyed');
    this.isInitialized = false;
  }
}

// Create singleton instance
const applicationBootstrap = new ApplicationBootstrap();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    applicationBootstrap.initialize().catch(error => {
      console.error('Failed to initialize application:', error);
    });
  });
} else {
  applicationBootstrap.initialize().catch(error => {
    console.error('Failed to initialize application:', error);
  });
}

// Export for module usage
export default applicationBootstrap;

// Global error handler for module loading errors
window.addEventListener('error', (event) => {
  if (event.target && (
    event.target.tagName === 'SCRIPT' ||
    event.target.tagName === 'LINK' ||
    event.target.tagName === 'IMG'
  )) {
    console.error('Resource loading error:', {
      tagName: event.target.tagName,
      src: event.target.src || event.target.href,
      error: event.error
    });
  }
}, true);