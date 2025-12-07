/**
 * Main Application Class
 * 
 * @fileoverview Core application class managing lifecycle, state,
 * modules, and services.
 * 
 * @version 2.0.0
 * @license MIT
 */

import EventEmitter from './EventEmitter.js';
import StateManager from './StateManager.js';
import ServiceRegistry from './ServiceRegistry.js';
import Logger from '../utils/Logger.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import PerformanceMonitor from '../utils/PerformanceMonitor.js';

import CONFIG from '../../config.js';
import { ENVIRONMENT } from '../../config.js';

/**
 * Main Application Class
 * @class App
 * @extends EventEmitter
 */
class App extends EventEmitter {
  constructor() {
    super();
    
    // Core components
    this.logger = new Logger('App');
    this.errorHandler = new ErrorHandler();
    this.performance = new PerformanceMonitor();
    this.state = new StateManager();
    this.services = new ServiceRegistry();
    
    // Modules registry
    this.modules = new Map();
    this.plugins = new Map();
    
    // Application state
    this.isInitialized = false;
    this.isDestroyed = false;
    this.container = null;
    
    // Metrics
    this.metrics = {
      startTime: Date.now(),
      sessions: 0,
      operations: 0,
      errors: 0
    };
    
    // Bind methods
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleOnlineStatus = this.handleOnlineStatus.bind(this);
    this.handleStorageEvent = this.handleStorageEvent.bind(this);
    
    this.logger.debug('Application instance created');
  }

  /**
   * Initialize application
   * @async
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      this.logger.warn('Application already initialized');
      return;
    }

    this.performance.mark('app:initialize:start');

    try {
      this.logger.info('Initializing application...', {
        version: CONFIG.APP.VERSION,
        environment: CONFIG.APP.ENVIRONMENT,
        build: CONFIG.APP.BUILD_ID
      });

      // Initialize core systems
      await this.initializeCoreSystems();

      // Register services
      await this.registerServices();

      // Initialize modules
      await this.initializeModules();

      // Setup event listeners
      this.setupEventListeners();

      // Load initial state
      await this.loadInitialState();

      // Update metrics
      this.metrics.sessions++;
      this.metrics.initializationTime = Date.now() - this.metrics.startTime;

      this.isInitialized = true;

      this.performance.mark('app:initialize:end');
      this.performance.measure(
        'app:initialization',
        'app:initialize:start',
        'app:initialize:end'
      );

      this.logger.info('Application initialized successfully', {
        initializationTime: this.performance.getMeasurement('app:initialization')?.duration,
        services: Array.from(this.services.getAll().keys()),
        modules: Array.from(this.modules.keys())
      });

      // Emit initialized event
      this.emit('initialized', {
        timestamp: new Date().toISOString(),
        metrics: this.metrics
      });

    } catch (error) {
      this.logger.error('Failed to initialize application', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      this.errorHandler.report(error, {
        component: 'App.initialize',
        severity: 'critical'
      });

      throw error;
    }
  }

  /**
   * Initialize core systems
   * @private
   * @async
   * @returns {Promise<void>}
   */
  async initializeCoreSystems() {
    this.logger.debug('Initializing core systems...');

    // Initialize state manager
    await this.state.initialize({
      persistence: true,
      encryption: CONFIG.STORAGE.ENCRYPTION.ENABLED,
      maxSize: CONFIG.STORAGE.MAX_SIZE
    });

    // Initialize error handler
    await this.errorHandler.initialize({
      reportToServer: CONFIG.FEATURES.ERROR_REPORTING,
      captureConsoleErrors: ENVIRONMENT.IS_DEVELOPMENT
    });

    // Initialize service registry
    await this.services.initialize(this);

    this.logger.debug('Core systems initialized');
  }

  /**
   * Register services
   * @private
   * @async
   * @returns {Promise<void>}
   */
  async registerServices() {
    this.logger.debug('Registering services...');

    // Import and register services dynamically
    const serviceModules = {
      'storage': () => import('../services/StorageService.js'),
      'auth': () => import('../services/AuthService.js'),
      'api': () => import('../services/ApiService.js'),
      'analytics': () => import('../services/AnalyticsService.js'),
      'processing': () => import('../services/ProcessingService.js'),
      'export': () => import('../services/ExportService.js'),
      'notifications': () => import('../services/NotificationService.js'),
      'theme': () => import('../services/ThemeService.js'),
      'i18n': () => import('../services/I18nService.js')
    };

    for (const [name, importFn] of Object.entries(serviceModules)) {
      try {
        const module = await importFn();
        const ServiceClass = module.default;
        const service = new ServiceClass(this);
        
        await service.initialize();
        this.services.register(name, service);
        
        this.logger.debug(`Service registered: ${name}`);
      } catch (error) {
        this.logger.error(`Failed to register service: ${name}`, {
          error: error.message
        });
        
        // Don't fail initialization for optional services
        if (name !== 'analytics' && name !== 'auth') {
          throw error;
        }
      }
    }

    this.logger.info('Services registered', {
      count: this.services.count(),
      names: Array.from(this.services.getAll().keys())
    });
  }

  /**
   * Initialize modules
   * @private
   * @async
   * @returns {Promise<void>}
   */
  async initializeModules() {
    this.logger.debug('Initializing modules...');

    const moduleDefinitions = {
      'text-processor': {
        path: '../modules/TextProcessor.js',
        dependencies: ['processing', 'storage']
      },
      'batch-processor': {
        path: '../modules/BatchProcessor.js',
        dependencies: ['processing', 'storage']
      },
      'regex-tool': {
        path: '../modules/RegexTool.js',
        dependencies: []
      },
      'data-anonymizer': {
        path: '../modules/DataAnonymizer.js',
        dependencies: ['processing']
      },
      'analytics-dashboard': {
        path: '../modules/AnalyticsDashboard.js',
        dependencies: ['analytics']
      }
    };

    for (const [name, definition] of Object.entries(moduleDefinitions)) {
      // Check dependencies
      const missingDeps = definition.dependencies.filter(
        dep => !this.services.has(dep)
      );

      if (missingDeps.length > 0) {
        this.logger.warn(`Skipping module ${name}, missing dependencies:`, missingDeps);
        continue;
      }

      try {
        const module = await import(definition.path);
        const ModuleClass = module.default;
        const instance = new ModuleClass(this);
        
        await instance.initialize();
        this.modules.set(name, instance);
        
        this.logger.debug(`Module initialized: ${name}`);
      } catch (error) {
        this.logger.error(`Failed to initialize module: ${name}`, {
          error: error.message
        });
      }
    }

    this.logger.info('Modules initialized', {
      count: this.modules.size,
      names: Array.from(this.modules.keys())
    });
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    // Page visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Online/offline status
    window.addEventListener('online', () => this.handleOnlineStatus(true));
    window.addEventListener('offline', () => this.handleOnlineStatus(false));

    // Storage events (cross-tab communication)
    window.addEventListener('storage', this.handleStorageEvent);

    // Beforeunload
    window.addEventListener('beforeunload', (event) => {
      if (this.state.hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    });

    // Resize with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.emit('window:resize', {
          width: window.innerWidth,
          height: window.innerHeight,
          orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        });
      }, 250);
    });

    this.logger.debug('Event listeners setup completed');
  }

  /**
   * Load initial state
   * @private
   * @async
   * @returns {Promise<void>}
   */
  async loadInitialState() {
    try {
      const storage = this.services.get('storage');
      if (!storage) return;

      // Load user preferences
      const preferences = await storage.get('user_preferences');
      if (preferences) {
        this.state.set('preferences', preferences);
      }

      // Load recent documents
      const recent = await storage.get('recent_documents');
      if (recent) {
        this.state.set('documents.recent', recent.slice(0, 10));
      }

      // Load presets
      const presets = await storage.get('presets');
      if (presets) {
        this.state.set('presets', presets);
      }

      this.logger.debug('Initial state loaded');
    } catch (error) {
      this.logger.warn('Failed to load initial state', {
        error: error.message
      });
    }
  }

  /**
   * Handle visibility change
   * @private
   * @param {Event} event
   */
  handleVisibilityChange(event) {
    const isVisible = !document.hidden;
    
    this.emit('visibility:change', {
      visible: isVisible,
      timestamp: new Date().toISOString()
    });

    if (isVisible) {
      this.emit('app:foreground');
      this.logger.debug('Application entered foreground');
      
      // Check for updates
      this.checkForUpdates();
    } else {
      this.emit('app:background');
      this.logger.debug('Application entered background');
      
      // Save state
      this.saveState();
    }
  }

  /**
   * Handle online status change
   * @private
   * @param {boolean} isOnline
   */
  handleOnlineStatus(isOnline) {
    this.state.set('network.online', isOnline);
    
    this.emit('network:status', {
      online: isOnline,
      timestamp: new Date().toISOString()
    });

    if (isOnline) {
      this.logger.info('Network connection restored');
      // Sync pending operations
      this.syncPendingOperations();
    } else {
      this.logger.warn('Network connection lost');
    }
  }

  /**
   * Handle storage events
   * @private
   * @param {StorageEvent} event
   */
  handleStorageEvent(event) {
    // Handle cross-tab communication
    if (event.key === 'tcp_sync') {
      try {
        const data = JSON.parse(event.newValue || '{}');
        this.emit('storage:sync', data);
      } catch (error) {
        this.logger.warn('Failed to parse storage sync data', {
          error: error.message
        });
      }
    }
  }

  /**
   * Save application state
   * @async
   * @returns {Promise<void>}
   */
  async saveState() {
    try {
      const storage = this.services.get('storage');
      if (!storage) return;

      const state = {
        preferences: this.state.get('preferences'),
        documents: {
          recent: this.state.get('documents.recent') || []
        },
        presets: this.state.get('presets') || [],
        timestamp: new Date().toISOString()
      };

      await storage.set('app_state', state);
      this.state.markAsSaved();
      
      this.logger.debug('Application state saved');
    } catch (error) {
      this.logger.error('Failed to save application state', {
        error: error.message
      });
    }
  }

  /**
   * Sync pending operations
   * @private
   * @async
   */
  async syncPendingOperations() {
    const processing = this.services.get('processing');
    if (!processing) return;

    try {
      const pending = await processing.getPendingOperations();
      if (pending.length > 0) {
        this.logger.info(`Syncing ${pending.length} pending operations`);
        
        for (const operation of pending) {
          await processing.syncOperation(operation);
        }
      }
    } catch (error) {
      this.logger.error('Failed to sync pending operations', {
        error: error.message
      });
    }
  }

  /**
   * Check for updates
   * @private
   */
  checkForUpdates() {
    // Check for service worker updates
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATES' });
    }

    // Check for app updates (if implemented)
    this.emit('update:check');
  }

  /**
   * Render application to container
   * @param {HTMLElement} container
   */
  render(container) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('Invalid container element');
    }

    this.container = container;
    
    // Basic app structure
    container.innerHTML = `
      <div class="app-layout">
        <header class="app-header" role="banner">
          <div class="header-content">
            <div class="logo">
              <h1>TextCleaner <span class="pro-badge">PRO</span></h1>
              <span class="version">v${CONFIG.APP.VERSION}</span>
            </div>
            <nav class="main-nav" role="navigation">
              <button class="nav-btn" data-action="toggle-sidebar" aria-label="Toggle sidebar">
                <span class="icon">?</span>
              </button>
              <div class="nav-actions">
                <button class="btn btn-icon" data-action="new-document" aria-label="New document">
                  <span class="icon">??</span>
                </button>
                <button class="btn btn-icon" data-action="open-settings" aria-label="Settings">
                  <span class="icon">??</span>
                </button>
              </div>
            </nav>
          </div>
        </header>
        
        <div class="app-main">
          <aside class="app-sidebar" role="complementary">
            <div class="sidebar-content">
              <div class="sidebar-section">
                <h3 class="section-title">Cleaners</h3>
                <div class="cleaner-list" id="cleaner-list"></div>
              </div>
              <div class="sidebar-section">
                <h3 class="section-title">Tools</h3>
                <div class="tool-list" id="tool-list"></div>
              </div>
            </div>
          </aside>
          
          <main class="app-content" role="main">
            <div class="workspace">
              <div class="workspace-header">
                <div class="workspace-tabs" id="workspace-tabs"></div>
                <div class="workspace-actions" id="workspace-actions"></div>
              </div>
              <div class="workspace-body" id="workspace-body"></div>
            </div>
          </main>
        </div>
        
        <footer class="app-footer" role="contentinfo">
          <div class="footer-content">
            <div class="app-stats" id="app-stats"></div>
            <div class="footer-links">
              <a href="${CONFIG.APP.PRIVACY_POLICY_URL}" target="_blank">Privacy</a>
              <a href="${CONFIG.APP.TERMS_URL}" target="_blank">Terms</a>
              <a href="mailto:${CONFIG.APP.SUPPORT_EMAIL}">Support</a>
            </div>
          </div>
        </footer>
        
        <div id="modal-container"></div>
        <div id="notification-container"></div>
      </div>
    `;

    // Add basic styles
    this.addStyles();
    
    // Initialize UI components
    this.initializeUI();
    
    this.logger.debug('Application rendered');
  }

  /**
   * Add basic styles
   * @private
   */
  addStyles() {
    const styles = `
      <style>
        .app-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .app-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
        }
        
        .header-content {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .logo h1 {
          font-size: 20px;
          font-weight: 700;
          color: #2563eb;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .pro-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        
        .version {
          font-size: 12px;
          color: #64748b;
          margin-left: 8px;
        }
        
        .main-nav {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .nav-btn, .btn {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .nav-btn:hover, .btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        
        .btn-icon {
          padding: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .icon {
          font-size: 18px;
          line-height: 1;
        }
        
        .app-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .app-sidebar {
          width: 280px;
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          overflow-y: auto;
          padding: 24px;
        }
        
        .sidebar-section {
          margin-bottom: 32px;
        }
        
        .section-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 12px;
          font-weight: 600;
        }
        
        .app-content {
          flex: 1;
          overflow: hidden;
          background: white;
        }
        
        .workspace {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .workspace-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .workspace-body {
          flex: 1;
          overflow: auto;
          padding: 24px;
        }
        
        .app-footer {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          padding: 16px 24px;
        }
        
        .footer-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          color: #64748b;
        }
        
        .footer-links {
          display: flex;
          gap: 24px;
        }
        
        .footer-links a {
          color: #64748b;
          text-decoration: none;
        }
        
        .footer-links a:hover {
          color: #2563eb;
          text-decoration: underline;
        }
        
        #modal-container, #notification-container {
          position: fixed;
          z-index: 1000;
          pointer-events: none;
        }
        
        @media (max-width: 768px) {
          .app-sidebar {
            position: fixed;
            top: 64px;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 900;
          }
          
          .app-sidebar.open {
            transform: translateX(0);
          }
          
          .footer-content {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  /**
   * Initialize UI components
   * @private
   */
  initializeUI() {
    // Initialize cleaner list
    this.initializeCleanerList();
    
    // Initialize tool list
    this.initializeToolList();
    
    // Initialize workspace
    this.initializeWorkspace();
    
    // Bind events
    this.bindUIEvents();
    
    this.logger.debug('UI components initialized');
  }

  /**
   * Initialize cleaner list
   * @private
   */
  initializeCleanerList() {
    const cleanerList = this.container.querySelector('#cleaner-list');
    if (!cleanerList) return;

    const cleaners = [
      { id: 'general', name: 'General Cleaner', icon: '??' },
      { id: 'csv', name: 'CSV Processor', icon: '??' },
      { id: 'json', name: 'JSON Formatter', icon: '{}' },
      { id: 'html', name: 'HTML Cleaner', icon: '??' },
      { id: 'markdown', name: 'Markdown', icon: '??' },
      { id: 'sql', name: 'SQL Formatter', icon: '???' },
      { id: 'code', name: 'Code Formatter', icon: '??' }
    ];

    cleanerList.innerHTML = cleaners.map(cleaner => `
      <button class="cleaner-btn" data-cleaner="${cleaner.id}" aria-label="${cleaner.name}">
        <span class="cleaner-icon">${cleaner.icon}</span>
        <span class="cleaner-name">${cleaner.name}</span>
      </button>
    `).join('');
  }

  /**
   * Initialize tool list
   * @private
   */
  initializeToolList() {
    const toolList = this.container.querySelector('#tool-list');
    if (!toolList) return;

    const tools = [
      { id: 'regex', name: 'Regex Tool', icon: '??' },
      { id: 'batch', name: 'Batch Process', icon: '??' },
      { id: 'anonymize', name: 'Anonymize', icon: '??' },
      { id: 'export', name: 'Export', icon: '??' }
    ];

    toolList.innerHTML = tools.map(tool => `
      <button class="tool-btn" data-tool="${tool.id}" aria-label="${tool.name}">
        <span class="tool-icon">${tool.icon}</span>
        <span class="tool-name">${tool.name}</span>
      </button>
    `).join('');
  }

  /**
   * Initialize workspace
   * @private
   */
  initializeWorkspace() {
    const workspaceBody = this.container.querySelector('#workspace-body');
    if (!workspaceBody) return;

    workspaceBody.innerHTML = `
      <div class="editor-container">
        <div class="editor-section">
          <div class="editor-header">
            <h3>Input</h3>
            <div class="editor-stats">
              <span class="stat" data-stat="chars">0 chars</span>
              <span class="stat" data-stat="words">0 words</span>
              <span class="stat" data-stat="lines">0 lines</span>
            </div>
          </div>
          <textarea 
            id="input-text" 
            class="text-editor" 
            placeholder="Paste your text here or drag & drop a file..."
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            autocorrect="off"
            rows="20"
          ></textarea>
          <div class="editor-actions">
            <button class="btn btn-sm" data-action="clear-input" aria-label="Clear input">Clear</button>
            <button class="btn btn-sm" data-action="paste-clipboard" aria-label="Paste from clipboard">Paste</button>
            <button class="btn btn-sm" data-action="load-file" aria-label="Load file">Load File</button>
          </div>
        </div>
        
        <div class="editor-section">
          <div class="editor-header">
            <h3>Output</h3>
            <div class="editor-stats">
              <span class="stat" data-stat="output-chars">0 chars</span>
              <span class="stat" data-stat="reduction">0% reduction</span>
            </div>
          </div>
          <textarea 
            id="output-text" 
            class="text-editor" 
            readonly
            placeholder="Processed text will appear here..."
            rows="20"
          ></textarea>
          <div class="editor-actions">
            <button class="btn btn-sm" data-action="copy-output" aria-label="Copy output">Copy</button>
            <button class="btn btn-sm" data-action="download-output" aria-label="Download output">Download</button>
            <button class="btn btn-sm" data-action="clear-output" aria-label="Clear output">Clear</button>
          </div>
        </div>
      </div>
      
      <div class="process-controls">
        <div class="process-options">
          <label class="option">
            <input type="checkbox" id="auto-process" checked>
            <span>Auto-process</span>
          </label>
          <label class="option">
            <input type="checkbox" id="preserve-formatting">
            <span>Preserve formatting</span>
          </label>
          <label class="option">
            <input type="checkbox" id="remove-empty-lines" checked>
            <span>Remove empty lines</span>
          </label>
        </div>
        <button id="process-btn" class="btn btn-primary btn-lg" aria-label="Process text">
          <span class="btn-text">Process Text</span>
          <span class="btn-icon">?</span>
        </button>
      </div>
    `;
  }

  /**
   * Bind UI events
   * @private
   */
  bindUIEvents() {
    // Sidebar toggle
    const toggleBtn = this.container.querySelector('[data-action="toggle-sidebar"]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const sidebar = this.container.querySelector('.app-sidebar');
        sidebar.classList.toggle('open');
      });
    }

    // Cleaner buttons
    const cleanerBtns = this.container.querySelectorAll('.cleaner-btn');
    cleanerBtns.forEach(btn => {
      btn.addEventListener('click', (event) => {
        const cleanerId = event.currentTarget.dataset.cleaner;
        this.selectCleaner(cleanerId);
      });
    });

    // Tool buttons
    const toolBtns = this.container.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', (event) => {
        const toolId = event.currentTarget.dataset.tool;
        this.openTool(toolId);
      });
    });

    // Process button
    const processBtn = this.container.querySelector('#process-btn');
    if (processBtn) {
      processBtn.addEventListener('click', () => this.processText());
    }

    // Input textarea events
    const inputText = this.container.querySelector('#input-text');
    if (inputText) {
      // Auto-resize
      inputText.addEventListener('input', () => {
        this.updateInputStats();
        
        if (this.container.querySelector('#auto-process').checked) {
          this.processText();
        }
      });

      // Drag and drop
      inputText.addEventListener('dragover', (event) => {
        event.preventDefault();
        inputText.classList.add('drag-over');
      });

      inputText.addEventListener('dragleave', () => {
        inputText.classList.remove('drag-over');
      });

      inputText.addEventListener('drop', (event) => {
        event.preventDefault();
        inputText.classList.remove('drag-over');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
          this.handleFileDrop(files[0]);
        }
      });
    }

    // Action buttons
    const actionButtons = this.container.querySelectorAll('[data-action]');
    actionButtons.forEach(btn => {
      const action = btn.dataset.action;
      btn.addEventListener('click', () => this.handleAction(action));
    });

    this.logger.debug('UI events bound');
  }

  /**
   * Select cleaner
   * @param {string} cleanerId
   */
  selectCleaner(cleanerId) {
    this.state.set('selectedCleaner', cleanerId);
    
    // Update UI
    const cleanerBtns = this.container.querySelectorAll('.cleaner-btn');
    cleanerBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cleaner === cleanerId);
    });

    this.emit('cleaner:selected', { cleanerId });
    this.logger.debug(`Cleaner selected: ${cleanerId}`);
  }

  /**
   * Open tool
   * @param {string} toolId
   */
  openTool(toolId) {
    this.emit('tool:open', { toolId });
    
    // For now, just show notification
    const toolNames = {
      regex: 'Regex Tool',
      batch: 'Batch Processor',
      anonymize: 'Data Anonymizer',
      export: 'Export Manager'
    };
    
    this.showNotification({
      type: 'info',
      title: `${toolNames[toolId] || 'Tool'} opened`,
      message: 'Tool functionality will be implemented in the next phase.',
      duration: 3000
    });
    
    this.logger.debug(`Tool opened: ${toolId}`);
  }

  /**
   * Process text
   * @async
   */
  async processText() {
    const inputText = this.container.querySelector('#input-text');
    const outputText = this.container.querySelector('#output-text');
    const processBtn = this.container.querySelector('#process-btn');
    
    if (!inputText || !outputText || !processBtn) return;

    const text = inputText.value.trim();
    if (!text) {
      this.showNotification({
        type: 'warning',
        title: 'No input',
        message: 'Please enter some text to process.',
        duration: 3000
      });
      return;
    }

    // Disable button and show loading
    processBtn.disabled = true;
    processBtn.innerHTML = '<span class="btn-text">Processing...</span><span class="spinner">?</span>';

    try {
      const processingService = this.services.get('processing');
      if (!processingService) {
        throw new Error('Processing service not available');
      }

      const selectedCleaner = this.state.get('selectedCleaner') || 'general';
      const options = {
        preserveFormatting: this.container.querySelector('#preserve-formatting').checked,
        removeEmptyLines: this.container.querySelector('#remove-empty-lines').checked
      };

      this.performance.mark('process:start');
      
      const result = await processingService.process(text, selectedCleaner, options);
      
      this.performance.mark('process:end');
      this.performance.measure('text-processing', 'process:start', 'process:end');

      outputText.value = result.output;
      
      // Update stats
      this.updateOutputStats(text, result.output);
      
      // Update metrics
      this.metrics.operations++;
      
      this.showNotification({
        type: 'success',
        title: 'Text processed',
        message: `Processed ${text.length} characters in ${this.performance.getMeasurement('text-processing')?.duration.toFixed(0)}ms`,
        duration: 3000
      });

      this.logger.info('Text processed successfully', {
        inputLength: text.length,
        outputLength: result.output.length,
        processingTime: this.performance.getMeasurement('text-processing')?.duration,
        cleaner: selectedCleaner
      });

    } catch (error) {
      this.logger.error('Text processing failed', {
        error: error.message,
        stack: error.stack
      });

      this.showNotification({
        type: 'error',
        title: 'Processing failed',
        message: error.message || 'Failed to process text',
        duration: 5000
      });

      this.metrics.errors++;
    } finally {
      // Restore button
      processBtn.disabled = false;
      processBtn.innerHTML = '<span class="btn-text">Process Text</span><span class="btn-icon">?</span>';
    }
  }

  /**
   * Update input stats
   * @private
   */
  updateInputStats() {
    const inputText = this.container.querySelector('#input-text');
    if (!inputText) return;

    const text = inputText.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split('\n').length : 0;

    // Update stat elements
    const charStat = this.container.querySelector('[data-stat="chars"]');
    const wordStat = this.container.querySelector('[data-stat="words"]');
    const lineStat = this.container.querySelector('[data-stat="lines"]');

    if (charStat) charStat.textContent = `${chars.toLocaleString()} chars`;
    if (wordStat) wordStat.textContent = `${words.toLocaleString()} words`;
    if (lineStat) lineStat.textContent = `${lines.toLocaleString()} lines`;
  }

  /**
   * Update output stats
   * @private
   * @param {string} input
   * @param {string} output
   */
  updateOutputStats(input, output) {
    const inputLength = input.length;
    const outputLength = output.length;
    const reduction = inputLength > 0 ? ((inputLength - outputLength) / inputLength * 100).toFixed(1) : 0;

    // Update stat elements
    const outputCharStat = this.container.querySelector('[data-stat="output-chars"]');
    const reductionStat = this.container.querySelector('[data-stat="reduction"]');

    if (outputCharStat) outputCharStat.textContent = `${outputLength.toLocaleString()} chars`;
    if (reductionStat) {
      const reductionText = reduction > 0 ? `${reduction}% reduction` : 'No reduction';
      reductionStat.textContent = reductionText;
    }
  }

  /**
   * Handle file drop
   * @private
   * @param {File} file
   */
  async handleFileDrop(file) {
    try {
      const processingService = this.services.get('processing');
      if (!processingService) return;

      const text = await processingService.readFile(file);
      const inputText = this.container.querySelector('#input-text');
      
      if (inputText) {
        inputText.value = text;
        this.updateInputStats();
        
        this.showNotification({
          type: 'success',
          title: 'File loaded',
          message: `${file.name} (${file.size.toLocaleString()} bytes)`,
          duration: 3000
        });
      }
    } catch (error) {
      this.logger.error('File drop failed', {
        error: error.message,
        fileName: file.name,
        fileSize: file.size
      });

      this.showNotification({
        type: 'error',
        title: 'Failed to load file',
        message: error.message || 'Invalid file format',
        duration: 5000
      });
    }
  }

  /**
   * Handle action
   * @private
   * @param {string} action
   */
  handleAction(action) {
    const inputText = this.container.querySelector('#input-text');
    const outputText = this.container.querySelector('#output-text');

    switch (action) {
      case 'clear-input':
        if (inputText) {
          inputText.value = '';
          this.updateInputStats();
        }
        break;

      case 'clear-output':
        if (outputText) {
          outputText.value = '';
          this.updateOutputStats('', '');
        }
        break;

      case 'paste-clipboard':
        navigator.clipboard.readText()
          .then(text => {
            if (inputText) {
              inputText.value = text;
              this.updateInputStats();
            }
          })
          .catch(error => {
            this.logger.warn('Failed to read clipboard', { error: error.message });
          });
        break;

      case 'copy-output':
        if (outputText && outputText.value) {
          navigator.clipboard.writeText(outputText.value)
            .then(() => {
              this.showNotification({
                type: 'success',
                title: 'Copied',
                message: 'Output copied to clipboard',
                duration: 2000
              });
            })
            .catch(error => {
              this.logger.warn('Failed to copy to clipboard', { error: error.message });
            });
        }
        break;

      case 'download-output':
        if (outputText && outputText.value) {
          const blob = new Blob([outputText.value], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cleaned-text-${new Date().toISOString().slice(0, 10)}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        }
        break;

      case 'load-file':
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.csv,.json,.md,.html,.log,.sql,.js,.ts,.py,.java,.cpp,.c,.go,.rs,.php,.rb';
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) this.handleFileDrop(file);
        };
        input.click();
        break;

      case 'new-document':
        if (inputText) inputText.value = '';
        if (outputText) outputText.value = '';
        this.updateInputStats();
        this.updateOutputStats('', '');
        break;

      case 'open-settings':
        this.openSettings();
        break;
    }
  }

  /**
   * Open settings
   * @private
   */
  openSettings() {
    // TODO: Implement settings modal
    this.showNotification({
      type: 'info',
      title: 'Settings',
      message: 'Settings will be available in the next update.',
      duration: 3000
    });
  }

  /**
   * Show notification
   * @param {Object} options
   * @param {string} options.type - success, error, warning, info
   * @param {string} options.title
   * @param {string} options.message
   * @param {number} options.duration
   * @param {Array} options.actions
   */
  showNotification(options) {
    const notificationService = this.services.get('notifications');
    if (notificationService) {
      notificationService.show(options);
    } else {
      // Fallback to console
      console[options.type === 'error' ? 'error' : 'log'](`${options.title}: ${options.message}`);
    }
  }

  /**
   * Get service by name
   * @param {string} name
   * @returns {Object|null}
   */
  getService(name) {
    return this.services.get(name);
  }

  /**
   * Get module by name
   * @param {string} name
   * @returns {Object|null}
   */
  getModule(name) {
    return this.modules.get(name);
  }

  /**
   * Get application state
   * @returns {Object}
   */
  getState() {
    return this.state.getAll();
  }

  /**
   * Get application metrics
   * @returns {Object}
   */
  getMetrics() {
    return { ...this.metrics, uptime: Date.now() - this.metrics.startTime };
  }

  /**
   * Dispatch event
   * @param {string} event
   * @param {any} data
   */
  dispatchEvent(event, data) {
    this.emit(event, data);
  }

  /**
   * Destroy application
   * @async
   */
  async destroy() {
    if (this.isDestroyed) return;

    this.logger.info('Destroying application...');

    try {
      // Save state
      await this.saveState();

      // Destroy modules
      for (const [name, module] of this.modules) {
        try {
          if (typeof module.destroy === 'function') {
            await module.destroy();
          }
        } catch (error) {
          this.logger.error(`Failed to destroy module ${name}`, { error: error.message });
        }
      }

      // Destroy services
      await this.services.destroy();

      // Destroy core systems
      await this.state.destroy();
      await this.errorHandler.destroy();

      // Remove event listeners
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('online', () => this.handleOnlineStatus(true));
      window.removeEventListener('offline', () => this.handleOnlineStatus(false));
      window.removeEventListener('storage', this.handleStorageEvent);

      // Clear container
      if (this.container) {
        this.container.innerHTML = '';
        this.container = null;
      }

      this.isDestroyed = true;
      this.isInitialized = false;

      this.logger.info('Application destroyed successfully');

    } catch (error) {
      this.logger.error('Failed to destroy application', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

// Export the application class
export default App;

// Export application instance for global access
let appInstance = null;

/**
 * Get or create application instance
 * @returns {App}
 */
export const getApp = () => {
  if (!appInstance) {
    appInstance = new App();
  }
  return appInstance;
};

/**
 * Initialize application
 * @async
 * @returns {Promise<App>}
 */
export const initializeApp = async () => {
  const app = getApp();
  if (!app.isInitialized) {
    await app.initialize();
  }
  return app;
};

/**
 * Destroy application
 * @async
 */
export const destroyApp = async () => {
  if (appInstance) {
    await appInstance.destroy();
    appInstance = null;
  }
};