/**
 * UI Controller - Manage UI interactions and updates
 */

class UIController {
    constructor(app) {
        this.app = app;
        this.elements = {};
        this.isInitialized = false;
    }

    async init() {
        try {
            this.cacheElements();
            this.bindEvents();
            this.setupTheme();
            this.updateUI();
            this.isInitialized = true;
            console.log('UI Controller initialized');
        } catch (error) {
            console.error('Failed to initialize UI Controller:', error);
            throw error;
        }
    }

    cacheElements() {
        // Cache frequently used DOM elements
        this.elements = {
            // Input/Output
            inputText: document.getElementById('input-text'),
            outputText: document.getElementById('output-text'),
            processBtn: document.getElementById('process-btn'),
            
            // Controls
            formatSelect: document.getElementById('format-select'),
            autoProcess: document.getElementById('auto-process'),
            preserveFormatting: document.getElementById('preserve-formatting'),
            
            // Navigation
            sidebar: document.getElementById('sidebar'),
            cleanerList: document.getElementById('cleaner-list'),
            
            // Stats
            totalProcessed: document.getElementById('total-processed'),
            timeSaved: document.getElementById('time-saved'),
            editorStats: document.querySelectorAll('[data-stat]'),
            
            // Containers
            modalContainer: document.getElementById('modal-container'),
            notificationContainer: document.getElementById('notification-container')
        };
    }

    bindEvents() {
        // Process button
        this.elements.processBtn?.addEventListener('click', () => this.handleProcess());
        
        // Input text changes
        this.elements.inputText?.addEventListener('input', (e) => {
            this.updateStats();
            if (this.elements.autoProcess?.checked) {
                this.debounceProcess();
            }
        });
        
        // Format selection
        this.elements.formatSelect?.addEventListener('change', (e) => {
            this.app.state.update({ currentFormat: e.target.value });
        });
        
        // Auto-process toggle
        this.elements.autoProcess?.addEventListener('change', (e) => {
            this.app.state.updateSettings({ autoProcess: e.target.checked });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Window events
        window.addEventListener('resize', () => this.handleResize());
        
        // Theme toggle (if exists)
        const themeToggle = document.querySelector('[data-action="toggle-theme"]');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Sidebar toggle
        const sidebarToggle = document.querySelector('[data-action="toggle-sidebar"]');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Cleaner selection
        this.elements.cleanerList?.addEventListener('click', (e) => {
            const cleanerBtn = e.target.closest('[data-cleaner]');
            if (cleanerBtn) {
                const cleanerId = cleanerBtn.dataset.cleaner;
                this.selectCleaner(cleanerId);
            }
        });
    }

    setupTheme() {
        const savedTheme = this.app.state.getState().settings.theme;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let theme = savedTheme;
        if (theme === 'auto') {
            theme = systemPrefersDark ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        this.app.state.updateSettings({ theme: newTheme });
        
        this.showNotification(`Theme changed to ${newTheme}`, 'info');
    }

    toggleSidebar() {
        const sidebar = this.elements.sidebar;
        if (!sidebar) return;
        
        const isCollapsed = sidebar.classList.contains('collapsed');
        if (isCollapsed) {
            sidebar.classList.remove('collapsed');
            sidebar.style.width = '280px';
        } else {
            sidebar.classList.add('collapsed');
            sidebar.style.width = '64px';
        }
    }

    async handleProcess() {
        const input = this.elements.inputText.value.trim();
        if (!input) {
            this.showNotification('Please enter some text to process', 'warning');
            return;
        }

        try {
            this.setProcessingState(true);
            
            const state = this.app.state.getState();
            const result = await this.app.processText(input, {
                cleaner: state.selectedCleaner,
                format: state.currentFormat
            });
            
            this.elements.outputText.value = result.output;
            this.app.state.setOutputText(result.output);
            
            // Update statistics in UI
            this.updateStats();
            this.updateGlobalStats(result.metadata);
            
            this.showNotification('Text processed successfully', 'success');
            
        } catch (error) {
            console.error('Processing error:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.setProcessingState(false);
        }
    }

    setProcessingState(isProcessing) {
        const btn = this.elements.processBtn;
        if (!btn) return;
        
        if (isProcessing) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loader"></span> Processing...';
            this.app.state.setProcessing(true);
        } else {
            btn.disabled = false;
            btn.textContent = 'Process Text';
            this.app.state.setProcessing(false);
        }
    }

    updateStats() {
        const input = this.elements.inputText.value;
        
        const chars = input.length;
        const words = input.trim().split(/\s+/).filter(w => w.length > 0).length;
        const lines = input.split('\n').length;
        
        // Update character stats in editor header
        this.elements.editorStats.forEach(stat => {
            const type = stat.dataset.stat;
            switch (type) {
                case 'chars':
                    stat.textContent = `${chars.toLocaleString()} chars`;
                    break;
                case 'words':
                    stat.textContent = `${words.toLocaleString()} words`;
                    break;
                case 'lines':
                    stat.textContent = `${lines.toLocaleString()} lines`;
                    break;
            }
        });
    }

    updateGlobalStats(metadata) {
        const stats = this.app.stats;
        if (stats && metadata) {
            stats.recordOperation('text_processing', {
                characters: metadata.inputLength || 0,
                words: metadata.words || 0,
                lines: metadata.lines || 0,
                processingTime: metadata.processingTime || 0,
                cleaner: metadata.cleaner,
                format: metadata.format
            });
            
            // Update displayed stats
            if (this.elements.totalProcessed) {
                this.elements.totalProcessed.textContent = 
                    stats.stats.processing.totalOperations.toLocaleString();
            }
            
            if (this.elements.timeSaved) {
                const timeSaved = stats.getTimeSaved();
                this.elements.timeSaved.textContent = timeSaved.formatted;
            }
        }
    }

    selectCleaner(cleanerId) {
        // Update active cleaner in UI
        const previousActive = this.elements.cleanerList?.querySelector('.active');
        if (previousActive) {
            previousActive.classList.remove('active');
        }
        
        const newActive = this.elements.cleanerList?.querySelector(`[data-cleaner="${cleanerId}"]`);
        if (newActive) {
            newActive.classList.add('active');
        }
        
        // Update application state
        this.app.state.setSelectedCleaner(cleanerId);
        
        this.showNotification(`Selected cleaner: ${cleanerId}`, 'info');
    }

    updateCleanerList(cleaners) {
        if (!this.elements.cleanerList) return;
        
        this.elements.cleanerList.innerHTML = cleaners.map(cleaner => `
            <button class="cleaner-btn ${cleaner.id === this.app.state.getSelectedCleaner() ? 'active' : ''}" 
                    data-cleaner="${cleaner.id}">
                <span class="cleaner-icon">${this.getCleanerIcon(cleaner.id)}</span>
                <span class="cleaner-name">${cleaner.name}</span>
                <span class="cleaner-desc">${cleaner.description}</span>
            </button>
        `).join('');
    }

    getCleanerIcon(cleanerId) {
        const icons = {
            general: '??',
            csv: '??',
            json: '{}',
            social: '??',
            code: '</>'
        };
        return icons[cleanerId] || '?';
    }

    debounceProcess = this.debounce(() => {
        if (this.elements.inputText.value.trim()) {
            this.handleProcess();
        }
    }, 300);

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    handleKeyboardShortcuts(e) {
        // Don't trigger shortcuts when user is typing in textarea
        if (e.target.tagName === 'TEXTAREA') {
            // Allow Ctrl+Enter to process
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.handleProcess();
            }
            return;
        }
        
        // Global shortcuts
        switch (e.key) {
            case 'F1':
                e.preventDefault();
                this.showHelp();
                break;
            case 'Escape':
                this.closeModals();
                break;
            case 's':
            case 'S':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.saveCurrent();
                }
                break;
        }
    }

    showHelp() {
        // Implementation for help modal
        console.log('Show help');
    }

    saveCurrent() {
        const state = this.app.state.getState();
        if (state.outputText) {
            // Implementation for save functionality
            this.showNotification('Save functionality coming soon', 'info');
        }
    }

    closeModals() {
        // Close any open modals
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }

    handleResize() {
        // Handle responsive behavior
        if (window.innerWidth < 768) {
            // Mobile adjustments
            if (this.elements.sidebar && !this.elements.sidebar.classList.contains('collapsed')) {
                this.toggleSidebar();
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-content">${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to container
        if (this.elements.notificationContainer) {
            this.elements.notificationContainer.appendChild(notification);
        } else {
            document.body.appendChild(notification);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    updateUI() {
        const state = this.app.state.getState();
        
        // Update input/output
        if (this.elements.inputText && state.inputText !== this.elements.inputText.value) {
            this.elements.inputText.value = state.inputText;
        }
        
        if (this.elements.outputText && state.outputText !== this.elements.outputText.value) {
            this.elements.outputText.value = state.outputText;
        }
        
        // Update format selection
        if (this.elements.formatSelect) {
            this.elements.formatSelect.value = state.currentFormat;
        }
        
        // Update checkboxes
        if (this.elements.autoProcess) {
            this.elements.autoProcess.checked = state.settings.autoProcess;
        }
        
        if (this.elements.preserveFormatting) {
            this.elements.preserveFormatting.checked = state.settings.preserveFormatting;
        }
        
        // Update stats
        this.updateStats();
    }

    reset() {
        this.elements.inputText.value = '';
        this.elements.outputText.value = '';
        this.updateStats();
        this.showNotification('UI reset', 'info');
    }
}

export default UIController;