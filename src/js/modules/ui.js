/**
 * UI Module
 * Menangani semua UI interactions dan updates
 */

class UI {
    constructor(app) {
        this.app = app;
        this.elements = {};
        this.isLoading = false;
        this.originalButtonStates = {};
        
        // Inisialisasi state yang diperlukan
        this.state = {
            currentTab: 'editor',
            lastInput: '',
            theme: localStorage.getItem('textcleaner_theme') || 'light'
        };
    }
    
    /**
     * Initialize UI components
     */
    async init() {
        console.log('?? Initializing UI...');
        
        // Cache DOM elements
        this.cacheElements();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load saved theme
        this.loadTheme();
        
        // Initialize stats
        this.updateInputStats();
        
        // Update UI state
        this.updateUIState();
        
        // Setup tab default
        this.switchTab('editor');
        
        console.log('? UI Initialized');
    }
    
    /**
     * Cache DOM elements untuk performa
     */
    cacheElements() {
        this.elements = {
            // Text areas
            inputText: document.getElementById('inputText'),
            outputText: document.getElementById('outputText'),
            
            // Tabs
            tabs: {
                editor: document.getElementById('editor-tab-btn'),
                result: document.getElementById('result-tab-btn'),
                tools: document.getElementById('tools-tab-btn'),
                batch: document.getElementById('batch-tab-btn')
            },
            tabPanels: {
                editor: document.getElementById('editor-tab'),
                result: document.getElementById('result-tab'),
                tools: document.getElementById('tools-tab'),
                batch: document.getElementById('batch-tab')
            },
            
            // Buttons
            cleanBtn: document.getElementById('cleanBtn'),
            themeToggle: document.getElementById('themeToggle'),
            upgradeBtn: document.getElementById('upgradeBtn'),
            formatDetectBtn: document.getElementById('formatDetectBtn'),
            pasteBtn: document.getElementById('pasteBtn'),
            uploadBtn: document.getElementById('uploadBtn'),
            exampleBtn: document.getElementById('exampleBtn'),
            clearBtn: document.getElementById('clearBtn'),
            copyBtn: document.getElementById('copyBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            undoBtn: document.getElementById('undoBtn'),
            applyToolsBtn: document.getElementById('applyToolsBtn'),
            resetToolsBtn: document.getElementById('resetToolsBtn'),
            
            // Modal
            paywallModal: document.getElementById('paywallModal'),
            closePaywall: document.getElementById('closePaywall'),
            startTrialBtn: document.getElementById('startTrialBtn'),
            
            // Quick actions
            quickActions: document.querySelectorAll('.action-btn'),
            
            // Stats
            charsIn: document.getElementById('charsIn'),
            wordsIn: document.getElementById('wordsIn'),
            linesIn: document.getElementById('linesIn'),
            
            // Empty state
            inputEmptyState: document.getElementById('inputEmptyState'),
            
            // Notification container
            notificationContainer: document.getElementById('notificationContainer')
        };
    }
    
    /**
     * Setup semua event listeners
     */
    setupEventListeners() {
        // Clean button
        if (this.elements.cleanBtn) {
            this.elements.cleanBtn.addEventListener('click', () => {
                this.cleanText();
            });
        }
        
        // Theme toggle - DIPERBAIKI: Sekarang menggunakan method di UI
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Upgrade button - DIPERBAIKI: Menampilkan modal langsung
        if (this.elements.upgradeBtn) {
            this.elements.upgradeBtn.addEventListener('click', () => this.showPaywall());
        }
        
        // Format detect button - DIPERBAIKI: Menampilkan notifikasi lebih jelas
        if (this.elements.formatDetectBtn) {
            this.elements.formatDetectBtn.addEventListener('click', () => {
                const text = this.elements.inputText?.value || '';
                if (!text.trim()) {
                    this.showNotification('Please enter text first', 'warning');
                    return;
                }
                
                const format = this.detectFormat(text);
                this.showNotification(`Format detected: ${format}`, 'info');
            });
        }
        
        // Paste button
        if (this.elements.pasteBtn) {
            this.elements.pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        }
        
        // Upload button
        if (this.elements.uploadBtn) {
            this.elements.uploadBtn.addEventListener('click', () => this.uploadFile());
        }
        
        // Example button
        if (this.elements.exampleBtn) {
            this.elements.exampleBtn.addEventListener('click', () => this.loadExample());
        }
        
        // Clear button
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => this.clearText());
        }
        
        // Copy button
        if (this.elements.copyBtn) {
            this.elements.copyBtn.addEventListener('click', () => this.copyResult());
        }
        
        // Download button
        if (this.elements.downloadBtn) {
            this.elements.downloadBtn.addEventListener('click', () => this.downloadResult());
        }
        
        // Undo button
        if (this.elements.undoBtn) {
            this.elements.undoBtn.addEventListener('click', () => this.undo());
        }
        
        // Apply tools button
        if (this.elements.applyToolsBtn) {
            this.elements.applyToolsBtn.addEventListener('click', () => this.applyTools());
        }
        
        // Reset tools button
        if (this.elements.resetToolsBtn) {
            this.elements.resetToolsBtn.addEventListener('click', () => this.resetTools());
        }
        
        // Modal buttons
        if (this.elements.closePaywall) {
            this.elements.closePaywall.addEventListener('click', () => this.hidePaywall());
        }
        
        if (this.elements.startTrialBtn) {
            this.elements.startTrialBtn.addEventListener('click', () => {
                this.startProTrial();
                this.hidePaywall();
            });
        }
        
        // Quick actions - DIPERBAIKI: Langsung jalankan cleaning
        if (this.elements.quickActions) {
            this.elements.quickActions.forEach(btn => {
                btn.addEventListener('click', (e) => this.handleQuickAction(e));
            });
        }
        
        // Tab switching - DIPERBAIKI: Sekarang dikontrol oleh UI
        Object.entries(this.elements.tabs).forEach(([tabId, tabBtn]) => {
            if (tabBtn) {
                tabBtn.addEventListener('click', () => this.switchTab(tabId));
            }
        });
        
        // Input text changes
        if (this.elements.inputText) {
            this.elements.inputText.addEventListener('input', () => {
                this.updateInputStats();
            });
        }
        
        // Click outside modal to close
        if (this.elements.paywallModal) {
            this.elements.paywallModal.addEventListener('click', (e) => {
                if (e.target === this.elements.paywallModal) {
                    this.hidePaywall();
                }
            });
        }

        // Button Skip Tutorial
        const skipTutorialBtn = document.getElementById('skipTutorial');
        if (skipTutorialBtn) {
            skipTutorialBtn.addEventListener('click', () => {
                this.showNotification('Tutorial skipped', 'info');
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter untuk clean
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.cleanText();
            }
            
            // Ctrl/Cmd + S untuk download
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.downloadResult();
            }
            
            // Escape untuk close modal
            if (e.key === 'Escape') {
                this.hidePaywall();
            }
        });
    }
    
    /**
     * Deteksi format teks sederhana
     */
    detectFormat(text) {
        if (!text) return 'Plain Text';
        
        // Cek WhatsApp format
        if (text.match(/\[\d{1,2}\/\d{1,2}\/\d{2,4}, \d{1,2}:\d{2} (?:AM|PM)\] .+:/)) {
            return 'WhatsApp Chat';
        }
        
        // Cek Telegram format
        if (text.match(/\[\d{2}:\d{2}, \d{1,2}\/\d{1,2}\/\d{4}\] .+:/)) {
            return 'Telegram Chat';
        }
        
        // Cek JSON
        try {
            JSON.parse(text);
            return 'JSON';
        } catch (e) {
            // Bukan JSON
        }
        
        // Cek XML/HTML
        if (text.match(/<[^>]+>/) && text.match(/<\/[^>]+>/)) {
            return text.match(/<html/i) ? 'HTML' : 'XML';
        }
        
        // Cek CSV
        const lines = text.trim().split('\n');
        if (lines.length > 1 && lines[0].includes(',')) {
            return 'CSV';
        }
        
        return 'Plain Text';
    }
    
    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('textcleaner_theme', newTheme);
        
        // Update icon
        const icon = this.elements.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        this.showNotification(`Switched to ${newTheme} theme`, 'info');
    }
    
    /**
     * Load saved theme dari localStorage
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('textcleaner_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update theme icon
        const icon = this.elements.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
    
    /**
     * Update input statistics
     */
    updateInputStats() {
        const text = this.elements.inputText?.value || '';
        const isEmpty = text.trim().length === 0;
        const chars = text.length;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const lines = text.split('\n').length;
        
        // Update empty state
        if (this.elements.inputText) {
            this.elements.inputText.classList.toggle('empty', isEmpty);
        }
        
        // Show/hide empty state
        if (this.elements.inputEmptyState) {
            this.elements.inputEmptyState.style.display = isEmpty ? 'flex' : 'none';
        }
        
        // Update stats
        if (this.elements.charsIn) this.elements.charsIn.textContent = chars.toLocaleString();
        if (this.elements.wordsIn) this.elements.wordsIn.textContent = words.toLocaleString();
        if (this.elements.linesIn) this.elements.linesIn.textContent = lines.toLocaleString();
    }
    
    /**
     * Switch antara tab
     */
    switchTab(tabId) {
        // Update state
        this.state.currentTab = tabId;
        
        // Hide all tab panels
        Object.values(this.elements.tabPanels).forEach(panel => {
            if (panel) {
                panel.classList.remove('active');
                panel.style.display = 'none';
            }
        });
        
        // Remove active class dari semua tabs
        Object.values(this.elements.tabs).forEach(tab => {
            if (tab) {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
            }
        });
        
        // Show selected tab panel
        const selectedPanel = this.elements.tabPanels[tabId];
        const selectedTab = this.elements.tabs[tabId];
        
        if (selectedPanel) {
            selectedPanel.classList.add('active');
            selectedPanel.style.display = 'block';
        }
        
        if (selectedTab) {
            selectedTab.classList.add('active');
            selectedTab.setAttribute('aria-selected', 'true');
        }
        
        // Update tab content jika diperlukan
        if (tabId === 'result' && this.elements.outputText) {
            setTimeout(() => {
                this.elements.outputText.focus();
            }, 100);
        }
        
        this.showNotification(`Switched to ${tabId} tab`, 'info');
    }
    
    /**
     * Clean text utama
     */
    cleanText() {
        const inputText = this.elements.inputText?.value || '';
        
        if (!inputText.trim()) {
            this.showNotification('Please enter some text first', 'warning');
            return;
        }
        
        this.showLoading(true);
        
        // Simpan input terakhir untuk undo
        this.state.lastInput = inputText;
        
        // Proses cleaning sederhana (sementara)
        let cleanedText = inputText;
        
        // Basic cleaning
        cleanedText = cleanedText
            .replace(/\r\n/g, '\n')  // Normalize line endings
            .replace(/\s+/g, ' ')     // Remove extra spaces
            .replace(/\n\s*\n\s*\n/g, '\n\n')  // Remove multiple empty lines
            .trim();
        
        // Tampilkan hasil
        if (this.elements.outputText) {
            this.elements.outputText.value = cleanedText;
        }
        
        // Switch ke tab result
        this.switchTab('result');
        
        this.showLoading(false);
        this.showNotification('Text cleaned successfully!', 'success');
    }
    
    /**
     * Paste dari clipboard
     */
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (this.elements.inputText) {
                this.elements.inputText.value = text;
                this.updateInputStats();
                this.showNotification('Text pasted from clipboard!', 'success');
            }
        } catch (err) {
            console.error('Failed to paste:', err);
            // Fallback: Prompt user untuk paste manual
            if (this.elements.inputText) {
                const manualText = prompt('Cannot access clipboard. Please paste your text here:');
                if (manualText) {
                    this.elements.inputText.value = manualText;
                    this.updateInputStats();
                    this.showNotification('Text pasted manually', 'info');
                }
            }
        }
    }
    
    /**
     * Upload file
     */
    uploadFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.json,.csv,.md,.html,.xml,.log';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Check file size (10MB max)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                this.showNotification(`File too large (max 10MB)`, 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                if (this.elements.inputText) {
                    this.elements.inputText.value = e.target.result;
                    this.updateInputStats();
                    this.showNotification(`Loaded: ${file.name}`, 'success');
                }
            };
            reader.onerror = () => this.showNotification('Error reading file', 'error');
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    /**
     * Load contoh text
     */
    loadExample() {
        const examples = [
            // WhatsApp example
            `[12/25/24, 8:30 PM] John: Merry Christmas everyone! ??
[12/25/24, 8:31 PM] Sarah: Merry Christmas! ??
[12/25/24, 8:32 PM] Mike: Happy holidays everyone! ??`,

            // Telegram example
            `[20:45, 25/12/2024] Alice: How's everyone doing?
[20:46, 25/12/2024] Bob: All good! Working on some projects.
[20:47, 25/12/2024] Charlie: Same here! Coding away.`,

            // JSON example
            `{"app":"TextCleaner Pro","version":"2.0","features":["chat_cleaning","batch_processing","format_detection"],"stats":{"users":1234,"rating":4.8}}`,

            // Text dengan banyak spasi
            `This    text    has    too    many    spaces.

And empty lines.


Let's clean it up!`
        ];
        
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        if (this.elements.inputText) {
            this.elements.inputText.value = randomExample;
            this.updateInputStats();
            this.showNotification('Example loaded! Try cleaning it.', 'info');
        }
    }
    
    /**
     * Clear text
     */
    clearText() {
        if (this.elements.inputText) {
            this.state.lastInput = this.elements.inputText.value;
            this.elements.inputText.value = '';
            if (this.elements.outputText) {
                this.elements.outputText.value = '';
            }
            this.updateInputStats();
            this.showNotification('Text cleared', 'info');
        }
    }
    
    /**
     * Copy result ke clipboard
     */
    async copyResult() {
        const outputText = this.elements.outputText?.value;
        if (!outputText?.trim()) {
            this.showNotification('No text to copy', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(outputText);
            
            // Visual feedback
            const originalHtml = this.elements.copyBtn?.innerHTML;
            if (this.elements.copyBtn) {
                this.elements.copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                this.elements.copyBtn.classList.add('btn-success');
                
                setTimeout(() => {
                    if (this.elements.copyBtn) {
                        this.elements.copyBtn.innerHTML = originalHtml;
                        this.elements.copyBtn.classList.remove('btn-success');
                    }
                }, 2000);
            }
            
            this.showNotification('Text copied to clipboard!', 'success');
        } catch (err) {
            // Fallback untuk browser lama
            this.elements.outputText?.select();
            this.elements.outputText?.setSelectionRange(0, 99999);
            document.execCommand('copy');
            this.showNotification('Text copied!', 'success');
        }
    }
    
    /**
     * Download result sebagai file
     */
    downloadResult() {
        const outputText = this.elements.outputText?.value;
        if (!outputText?.trim()) {
            this.showNotification('No text to download', 'warning');
            return;
        }
        
        // Tambahkan watermark untuk free users
        let textToDownload = outputText;
        if (!this.isPro()) {
            textToDownload += '\n\n---\nCleaned with TextCleaner Pro (Free)\nUpgrade to PRO for unlimited features: textcleanerpro.com';
        }
        
        const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        
        a.href = url;
        a.download = `cleaned_text_${date}_${time}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('File downloaded!', 'success');
    }
    
    /**
     * Undo last action
     */
    undo() {
        if (this.state.lastInput && this.elements.inputText) {
            this.elements.inputText.value = this.state.lastInput;
            this.updateInputStats();
            this.showNotification('Undone!', 'success');
        } else {
            this.showNotification('Nothing to undo', 'info');
        }
    }
    
    /**
     * Apply tools dari tab Tools
     */
    applyTools() {
        this.showNotification('Tools applied! Now click "Clean Text" to process.', 'info');
        // Switch ke editor tab untuk melihat hasil
        this.switchTab('editor');
    }
    
    /**
     * Reset tools ke default
     */
    resetTools() {
        const checkboxes = [
            'removeTimestamps', 'removeNames', 'anonymizeNames', 'mergeLines',
            'trimSpaces', 'removeExtraSpaces', 'removeEmptyLines', 'removeEmojis',
            'removeDuplicates', 'sortLines', 'formatJson', 'addLineNumbers'
        ];
        
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.checked = false;
        });
        
        // Reset radio buttons
        const textCaseRadios = document.querySelectorAll('input[name="textCase"]');
        textCaseRadios.forEach(radio => {
            radio.checked = radio.value === 'original';
        });
        
        this.showNotification('Tools reset to defaults', 'success');
    }
    
    /**
     * Handle quick actions - DIPERBAIKI: Langsung jalankan cleaning setelah setting
     */
    handleQuickAction(event) {
        const action = event.currentTarget.dataset.action;
        
        switch (action) {
            case 'clean-whatsapp':
                this.elements.inputText.value = `[12/25/24, 8:30 PM] John: Example WhatsApp chat
[12/25/24, 8:31 PM] Sarah: With timestamps and names
[12/25/24, 8:32 PM] Mike: Ready to clean!`;
                this.updateInputStats();
                this.cleanText();
                break;
                
            case 'format-json':
                this.elements.inputText.value = '{"app":"TextCleaner","users":["john","sarah","mike"],"stats":{"cleans":1234,"rating":4.8}}';
                this.updateInputStats();
                this.cleanText();
                break;
                
            case 'trim-all':
                // Basic trim example
                if (this.elements.inputText) {
                    this.elements.inputText.value = this.elements.inputText.value
                        .replace(/\s+/g, ' ')
                        .replace(/\n\s*\n\s*\n/g, '\n\n')
                        .trim();
                    this.updateInputStats();
                    this.cleanText();
                }
                break;
                
            case 'remove-duplicates':
                this.showNotification('Remove duplicates feature requires PRO version', 'warning');
                this.showPaywall();
                break;
        }
        
        this.showNotification(`Quick action "${action.replace('-', ' ')}" applied`, 'info');
    }
    
    /**
     * Tampilkan paywall modal
     */
    showPaywall() {
        if (this.elements.paywallModal) {
            this.elements.paywallModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
    }
    
    /**
     * Sembunyikan paywall modal
     */
    hidePaywall() {
        if (this.elements.paywallModal) {
            this.elements.paywallModal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
    
    /**
     * Start pro trial (simulasi)
     */
    startProTrial() {
        localStorage.setItem('textcleaner_pro_trial', 'true');
        this.showNotification('PRO Trial started! Enjoy premium features for 7 days.', 'success');
        this.updateUIState();
    }
    
    /**
     * Cek status pro
     */
    isPro() {
        return localStorage.getItem('textcleaner_pro_trial') === 'true' || 
               localStorage.getItem('textcleaner_pro') === 'true';
    }
    
    /**
     * Tampilkan notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Buat container jika tidak ada
        let container = this.elements.notificationContainer;
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
            this.elements.notificationContainer = container;
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            padding: 12px 16px;
            border-radius: 8px;
            background: ${type === 'success' ? '#d4edda' : 
                        type === 'error' ? '#f8d7da' : 
                        type === 'warning' ? '#fff3cd' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : 
                    type === 'error' ? '#721c24' : 
                    type === 'warning' ? '#856404' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : 
                              type === 'error' ? '#f5c6cb' : 
                              type === 'warning' ? '#ffeaa7' : '#bee5eb'};
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease;
        `;
        
        // Icon berdasarkan type
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'}" style="font-size: 18px;"></i>
            <span style="flex: 1;">${message}</span>
            <button class="notification-close" style="background: none; border: none; font-size: 20px; cursor: pointer; opacity: 0.7;">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove setelah duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Tambahkan animasi CSS
        if (!document.querySelector('#notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Tampilkan/sembunyikan loading state
     */
    showLoading(isLoading) {
        this.isLoading = isLoading;
        const cleanBtn = this.elements.cleanBtn;
        
        if (!cleanBtn) return;
        
        if (isLoading) {
            cleanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            cleanBtn.disabled = true;
        } else {
            cleanBtn.innerHTML = '<i class="fas fa-sparkles"></i> Clean Text Now';
            cleanBtn.disabled = false;
        }
    }
    
    /**
     * Update mobile layout
     */
    updateMobileLayout() {
        const isMobile = window.innerWidth < 768;
        const tabLabels = document.querySelectorAll('.tab-label');
        
        tabLabels.forEach(label => {
            label.style.display = isMobile ? 'none' : 'inline';
        });
    }
    
    /**
     * Update UI state
     */
    updateUIState() {
        // Update theme icon
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const icon = this.elements.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        // Update mobile layout
        this.updateMobileLayout();
        
        // Update PRO status
        if (this.isPro()) {
            const upgradeBtn = this.elements.upgradeBtn;
            if (upgradeBtn) {
                upgradeBtn.innerHTML = '<i class="fas fa-crown"></i> PRO Member';
                upgradeBtn.classList.add('btn-success');
                upgradeBtn.classList.remove('btn-primary');
                upgradeBtn.disabled = true;
            }
        }
    }

    /**
     * Visual feedback untuk success
     */
    showSuccessAnimation(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const originalHTML = element.innerHTML;
        const originalClass = element.className;
        
        element.innerHTML = '<i class="fas fa-check"></i> Success!';
        element.className = originalClass + ' btn-success';
        element.disabled = true;
        
        setTimeout(() => {
            element.innerHTML = originalHTML;
            element.className = originalClass;
            element.disabled = false;
        }, 2000);
    }

    /**
     * Tampilkan loading animation
     */
    showLoadingAnimation(elementId, text = 'Processing...') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        this.originalButtonStates[elementId] = {
            html: element.innerHTML,
            disabled: element.disabled
        };
        
        element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        element.disabled = true;
    }

    /**
     * Sembunyikan loading animation
     */
    hideLoadingAnimation(elementId) {
        const element = document.getElementById(elementId);
        if (!element || !this.originalButtonStates[elementId]) return;
        
        const original = this.originalButtonStates[elementId];
        element.innerHTML = original.html;
        element.disabled = original.disabled;
    }
}
export default UI;
