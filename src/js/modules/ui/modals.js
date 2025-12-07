/**
 * Modals - Modal dialog management
 */

class Modals {
    constructor() {
        this.modals = new Map();
        this.activeModal = null;
    }

    show(modalId, options = {}) {
        // Close existing modal if any
        if (this.activeModal) {
            this.close(this.activeModal);
        }

        const modal = this.createModal(modalId, options);
        document.body.appendChild(modal);
        this.activeModal = modalId;

        // Store reference
        this.modals.set(modalId, modal);

        // Trigger onShow callback
        if (options.onShow) {
            options.onShow();
        }

        return modalId;
    }

    createModal(modalId, options) {
        const {
            title = 'Modal',
            content = '',
            buttons = [],
            size = 'medium', // small, medium, large, full
            closable = true,
            onClose
        } = options;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = `modal-${modalId}`;
        modal.innerHTML = `
            <div class="modal modal-${size}">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    ${closable ? '<button class="modal-close">&times;</button>' : ''}
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttons.length > 0 ? `
                    <div class="modal-footer">
                        ${buttons.map(btn => `
                            <button class="btn btn-${btn.type || 'secondary'}" 
                                    data-action="${btn.action || 'close'}">
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        // Add event listeners
        if (closable) {
            const closeBtn = modal.querySelector('.modal-close');
            closeBtn.addEventListener('click', () => this.close(modalId, onClose));
        }

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal && closable) {
                this.close(modalId, onClose);
            }
        });

        // Button actions
        modal.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                if (action === 'close') {
                    this.close(modalId, onClose);
                } else if (options.onAction) {
                    options.onAction(action, button);
                }
            });
        });

        // Escape key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape' && closable) {
                this.close(modalId, onClose);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        return modal;
    }

    close(modalId, onClose) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        // Trigger onClose callback
        if (onClose) {
            onClose();
        }

        // Add fade-out animation
        modal.classList.add('fade-out');
        
        setTimeout(() => {
            modal.remove();
            this.modals.delete(modalId);
            this.activeModal = null;
        }, 300);
    }

    closeAll() {
        this.modals.forEach((modal, modalId) => {
            this.close(modalId);
        });
    }

    // Predefined modal types
    confirm(options) {
        return new Promise((resolve) => {
            const modalId = `confirm-${Date.now()}`;
            
            this.show(modalId, {
                title: options.title || 'Confirm',
                content: options.message || 'Are you sure?',
                buttons: [
                    {
                        text: options.cancelText || 'Cancel',
                        type: 'secondary',
                        action: 'cancel'
                    },
                    {
                        text: options.confirmText || 'Confirm',
                        type: 'primary',
                        action: 'confirm'
                    }
                ],
                onAction: (action) => {
                    resolve(action === 'confirm');
                    this.close(modalId);
                },
                onClose: () => resolve(false)
            });
        });
    }

    alert(options) {
        const modalId = `alert-${Date.now()}`;
        
        return this.show(modalId, {
            title: options.title || 'Alert',
            content: options.message || '',
            buttons: [
                {
                    text: options.buttonText || 'OK',
                    type: 'primary',
                    action: 'close'
                }
            ]
        });
    }

    prompt(options) {
        return new Promise((resolve) => {
            const modalId = `prompt-${Date.now()}`;
            const inputId = `prompt-input-${Date.now()}`;
            
            const content = `
                ${options.message || 'Please enter:'}
                <div class="form-group" style="margin-top: 1rem;">
                    <input type="${options.type || 'text'}" 
                           id="${inputId}" 
                           class="form-control" 
                           value="${options.defaultValue || ''}"
                           placeholder="${options.placeholder || ''}"
                           ${options.required ? 'required' : ''}>
                </div>
            `;
            
            this.show(modalId, {
                title: options.title || 'Input',
                content,
                buttons: [
                    {
                        text: options.cancelText || 'Cancel',
                        type: 'secondary',
                        action: 'cancel'
                    },
                    {
                        text: options.confirmText || 'OK',
                        type: 'primary',
                        action: 'confirm'
                    }
                ],
                onShow: () => {
                    const input = document.getElementById(inputId);
                    input?.focus();
                    if (options.selectOnShow) {
                        input?.select();
                    }
                },
                onAction: (action) => {
                    if (action === 'confirm') {
                        const input = document.getElementById(inputId);
                        resolve(input?.value || '');
                    } else {
                        resolve(null);
                    }
                    this.close(modalId);
                },
                onClose: () => resolve(null)
            });
        });
    }

    loading(options = {}) {
        const modalId = `loading-${Date.now()}`;
        
        return this.show(modalId, {
            title: options.title || 'Loading',
            content: `
                <div class="loading-container" style="text-align: center; padding: 2rem;">
                    <div class="loader"></div>
                    <p style="margin-top: 1rem;">${options.message || 'Please wait...'}</p>
                </div>
            `,
            closable: false,
            size: 'small'
        });
    }

    // File upload modal
    fileUpload(options = {}) {
        return new Promise((resolve) => {
            const modalId = `file-upload-${Date.now()}`;
            const inputId = `file-input-${Date.now()}`;
            
            const content = `
                <div class="file-upload-area" 
                     style="border: 2px dashed #ccc; padding: 2rem; text-align: center; border-radius: 8px;">
                    <p>${options.message || 'Drag & drop files here or click to browse'}</p>
                    <input type="file" 
                           id="${inputId}" 
                           ${options.multiple ? 'multiple' : ''}
                           accept="${options.accept || '*'}"
                           style="display: none;">
                    <button class="btn btn-secondary" onclick="document.getElementById('${inputId}').click()">
                        Browse Files
                    </button>
                </div>
                <div class="file-list" style="margin-top: 1rem; max-height: 200px; overflow-y: auto;"></div>
            `;
            
            let files = [];
            
            this.show(modalId, {
                title: options.title || 'Upload Files',
                content,
                buttons: [
                    {
                        text: 'Cancel',
                        type: 'secondary',
                        action: 'cancel'
                    },
                    {
                        text: 'Upload',
                        type: 'primary',
                        action: 'confirm'
                    }
                ],
                onShow: () => {
                    const fileInput = document.getElementById(inputId);
                    const fileList = document.querySelector('.file-list');
                    const dropArea = document.querySelector('.file-upload-area');
                    
                    // Handle file selection
                    fileInput.addEventListener('change', (e) => {
                        files = Array.from(e.target.files);
                        updateFileList();
                    });
                    
                    // Handle drag and drop
                    dropArea.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        dropArea.style.borderColor = '#007bff';
                    });
                    
                    dropArea.addEventListener('dragleave', () => {
                        dropArea.style.borderColor = '#ccc';
                    });
                    
                    dropArea.addEventListener('drop', (e) => {
                        e.preventDefault();
                        dropArea.style.borderColor = '#ccc';
                        files = Array.from(e.dataTransfer.files);
                        updateFileList();
                    });
                    
                    function updateFileList() {
                        fileList.innerHTML = files.map(file => `
                            <div class="file-item" style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #eee;">
                                <span>${file.name}</span>
                                <span>${formatBytes(file.size)}</span>
                            </div>
                        `).join('');
                    }
                    
                    function formatBytes(bytes) {
                        if (bytes === 0) return '0 Bytes';
                        const k = 1024;
                        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                        const i = Math.floor(Math.log(bytes) / Math.log(k));
                        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                    }
                },
                onAction: (action) => {
                    if (action === 'confirm' && files.length > 0) {
                        resolve(files);
                    } else {
                        resolve([]);
                    }
                    this.close(modalId);
                },
                onClose: () => resolve([])
            });
        });
    }

    // Settings modal
    showSettings(settings, onSave) {
        const modalId = `settings-${Date.now()}`;
        
        const content = `
            <form id="settings-form">
                <div class="form-group">
                    <label>Theme</label>
                    <select class="form-control" name="theme">
                        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Auto</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Font Size</label>
                    <select class="form-control" name="fontSize">
                        <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                        <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="autoProcess" ${settings.autoProcess ? 'checked' : ''}>
                        Auto-process on change
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="preserveFormatting" ${settings.preserveFormatting ? 'checked' : ''}>
                        Preserve formatting
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="showLineNumbers" ${settings.showLineNumbers ? 'checked' : ''}>
                        Show line numbers
                    </label>
                </div>
            </form>
        `;
        
        this.show(modalId, {
            title: 'Settings',
            content,
            buttons: [
                {
                    text: 'Cancel',
                    type: 'secondary',
                    action: 'cancel'
                },
                {
                    text: 'Save',
                    type: 'primary',
                    action: 'save'
                }
            ],
            onAction: (action) => {
                if (action === 'save') {
                    const form = document.getElementById('settings-form');
                    const formData = new FormData(form);
                    const newSettings = Object.fromEntries(formData.entries());
                    
                    // Convert checkbox values to boolean
                    newSettings.autoProcess = newSettings.autoProcess === 'on';
                    newSettings.preserveFormatting = newSettings.preserveFormatting === 'on';
                    newSettings.showLineNumbers = newSettings.showLineNumbers === 'on';
                    
                    if (onSave) {
                        onSave(newSettings);
                    }
                }
                this.close(modalId);
            }
        });
    }
}

export default Modals;