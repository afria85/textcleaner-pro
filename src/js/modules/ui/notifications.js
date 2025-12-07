/**
 * Notifications - Toast notification system
 */

class Notifications {
    constructor() {
        this.container = null;
        this.notifications = new Set();
        this.defaultOptions = {
            duration: 5000,
            position: 'top-right',
            type: 'info',
            closable: true,
            animate: true
        };
        
        this.initContainer();
    }

    initContainer() {
        // Create container if it doesn't exist
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    show(message, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.className = `notification notification-${opts.type}`;
        
        // Set position
        this.container.className = `notification-container notification-${opts.position}`;
        
        // Add content
        notification.innerHTML = `
            <div class="notification-content">
                ${this.getIcon(opts.type)}
                <div class="notification-message">${message}</div>
            </div>
            ${opts.closable ? '<button class="notification-close">&times;</button>' : ''}
        `;
        
        // Add to container
        this.container.appendChild(notification);
        this.notifications.add(notificationId);
        
        // Animate in
        if (opts.animate) {
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });
        }
        
        // Auto-remove if duration is set
        if (opts.duration > 0) {
            setTimeout(() => {
                this.remove(notificationId);
            }, opts.duration);
        }
        
        // Close button handler
        if (opts.closable) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => this.remove(notificationId));
        }
        
        // Return notification ID for manual control
        return notificationId;
    }

    getIcon(type) {
        const icons = {
            success: '?',
            error: '?',
            warning: '?',
            info: '?'
        };
        
        const icon = icons[type] || icons.info;
        return `<span class="notification-icon notification-icon-${type}">${icon}</span>`;
    }

    remove(notificationId) {
        const notification = document.getElementById(notificationId);
        if (!notification) return;
        
        // Animate out
        notification.classList.add('hide');
        
        // Remove after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(notificationId);
        }, 300);
    }

    removeAll() {
        this.notifications.forEach(id => this.remove(id));
    }

    // Convenience methods for different notification types
    success(message, options = {}) {
        return this.show(message, { ...options, type: 'success' });
    }

    error(message, options = {}) {
        return this.show(message, { ...options, type: 'error' });
    }

    warning(message, options = {}) {
        return this.show(message, { ...options, type: 'warning' });
    }

    info(message, options = {}) {
        return this.show(message, { ...options, type: 'info' });
    }

    // Progress notification
    progress(message, progress = 0, options = {}) {
        const notificationId = options.id || `progress-${Date.now()}`;
        
        let notification = document.getElementById(notificationId);
        
        if (!notification) {
            // Create new progress notification
            notification = document.createElement('div');
            notification.id = notificationId;
            notification.className = `notification notification-progress`;
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="notification-message">${message}</div>
                </div>
                ${options.closable !== false ? '<button class="notification-close">&times;</button>' : ''}
            `;
            
            this.container.appendChild(notification);
            this.notifications.add(notificationId);
            
            // Animate in
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });
            
            // Close button handler
            if (options.closable !== false) {
                const closeBtn = notification.querySelector('.notification-close');
                closeBtn.addEventListener('click', () => this.remove(notificationId));
            }
        } else {
            // Update existing notification
            const progressFill = notification.querySelector('.progress-fill');
            const messageEl = notification.querySelector('.notification-message');
            
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
            
            if (messageEl && message) {
                messageEl.textContent = message;
            }
        }
        
        // Complete and auto-remove if progress is 100%
        if (progress >= 100) {
            setTimeout(() => {
                this.remove(notificationId);
                if (options.onComplete) {
                    options.onComplete();
                }
            }, 1000);
        }
        
        return notificationId;
    }

    // Stacked notifications
    showStacked(messages, options = {}) {
        const stackId = `stack-${Date.now()}`;
        const stackContainer = document.createElement('div');
        stackContainer.className = 'notification-stack';
        stackContainer.id = stackId;
        
        messages.forEach((msg, index) => {
            setTimeout(() => {
                const notificationId = this.show(msg, {
                    ...options,
                    duration: options.duration || 3000,
                    position: options.position || 'top-right'
                });
                
                // Add to stack tracking if needed
            }, index * 100); // Stagger the notifications
        });
        
        return stackId;
    }

    // Action notification with buttons
    action(message, actions = [], options = {}) {
        const notificationId = `action-${Date.now()}`;
        
        const actionButtons = actions.map(action => `
            <button class="btn btn-sm btn-${action.type || 'secondary'}" 
                    data-action="${action.id || 'action'}">
                ${action.text}
            </button>
        `).join('');
        
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.className = `notification notification-action`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${message}</div>
                <div class="notification-actions">
                    ${actionButtons}
                </div>
            </div>
            ${options.closable !== false ? '<button class="notification-close">&times;</button>' : ''}
        `;
        
        this.container.appendChild(notification);
        this.notifications.add(notificationId);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Action button handlers
        actions.forEach(action => {
            const btn = notification.querySelector(`[data-action="${action.id || 'action'}"]`);
            if (btn && action.handler) {
                btn.addEventListener('click', () => {
                    action.handler();
                    if (action.autoClose !== false) {
                        this.remove(notificationId);
                    }
                });
            }
        });
        
        // Close button handler
        if (options.closable !== false) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => this.remove(notificationId));
        }
        
        // Auto-remove if duration is set
        if (options.duration > 0) {
            setTimeout(() => {
                this.remove(notificationId);
            }, options.duration);
        }
        
        return notificationId;
    }

    // Update existing notification
    update(notificationId, updates) {
        const notification = document.getElementById(notificationId);
        if (!notification) return false;
        
        if (updates.message) {
            const messageEl = notification.querySelector('.notification-message');
            if (messageEl) {
                messageEl.textContent = updates.message;
            }
        }
        
        if (updates.type) {
            // Update type/class
            const oldType = Array.from(notification.classList).find(c => c.startsWith('notification-'));
            if (oldType) {
                notification.classList.remove(oldType);
            }
            notification.classList.add(`notification-${updates.type}`);
            
            // Update icon if exists
            const iconEl = notification.querySelector('.notification-icon');
            if (iconEl) {
                iconEl.textContent = this.getIcon(updates.type);
            }
        }
        
        return true;
    }

    // Get notification count
    getCount() {
        return this.notifications.size;
    }

    // Clear all notifications of a specific type
    clearByType(type) {
        this.notifications.forEach(id => {
            const notification = document.getElementById(id);
            if (notification && notification.classList.contains(`notification-${type}`)) {
                this.remove(id);
            }
        });
    }
}

export default Notifications;