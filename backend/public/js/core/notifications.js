// Notification System - Vanilla JavaScript replacement for React Context

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.defaultDuration = 5000;
        this.maxNotifications = 5;
        this.init();
    }

    init() {
        // Create notification container if it doesn't exist
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(this.container);
        }
    }

    add(notification) {
        const id = utils.generateId();
        const newNotification = {
            id,
            type: notification.type || 'info',
            title: notification.title,
            message: notification.message || '',
            duration: notification.duration !== undefined ? notification.duration : this.defaultDuration,
            persistent: notification.persistent || false,
            actions: notification.actions || [],
            timestamp: Date.now(),
            ...notification
        };

        // Remove oldest notification if we exceed max
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications[0];
            this.remove(oldest.id);
        }

        this.notifications.push(newNotification);
        this.render(newNotification);

        // Auto remove notification if not persistent
        if (!newNotification.persistent && newNotification.duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, newNotification.duration);
        }

        // Update state
        state.set('notifications', [...this.notifications]);

        return id;
    }

    remove(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index > -1) {
            const notification = this.notifications[index];
            this.notifications.splice(index, 1);
            
            const element = document.getElementById(`notification-${id}`);
            if (element) {
                // Add removing animation
                element.classList.add('removing');
                setTimeout(() => {
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                }, 300);
            }

            // Update state
            state.set('notifications', [...this.notifications]);

            // Trigger callback if provided
            if (notification.onRemove) {
                notification.onRemove(notification);
            }
        }
    }

    removeAll() {
        const ids = this.notifications.map(n => n.id);
        ids.forEach(id => this.remove(id));
    }

    removeByType(type) {
        const toRemove = this.notifications.filter(n => n.type === type);
        toRemove.forEach(n => this.remove(n.id));
    }

    update(id, updates) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            Object.assign(notification, updates);
            const element = document.getElementById(`notification-${id}`);
            if (element) {
                this.updateElement(element, notification);
            }
            state.set('notifications', [...this.notifications]);
        }
    }

    render(notification) {
        const element = document.createElement('div');
        element.id = `notification-${notification.id}`;
        element.className = `toast max-w-sm w-full border rounded-lg shadow-lg p-4 ${this.getNotificationStyles(notification.type)} animate-slide-up`;
        
        element.innerHTML = this.getNotificationHTML(notification);
        
        // Add event listeners
        this.addEventListeners(element, notification);
        
        this.container.appendChild(element);

        // Trigger callback if provided
        if (notification.onShow) {
            notification.onShow(notification);
        }
    }

    getNotificationHTML(notification) {
        const actionsHTML = notification.actions.length > 0 
            ? `<div class="mt-3 flex gap-2">
                ${notification.actions.map(action => 
                    `<button class="btn btn-sm ${action.style || 'btn-outline'}" data-action="${action.id}">
                        ${action.label}
                    </button>`
                ).join('')}
               </div>`
            : '';

        return `
            <div class="flex items-start">
                <div class="flex-shrink-0 ${this.getIconStyles(notification.type)}">
                    ${this.getIcon(notification.type)}
                </div>
                <div class="ml-3 w-0 flex-1">
                    <p class="text-sm font-medium">
                        ${utils.escapeHtml(notification.title)}
                    </p>
                    ${notification.message ? `<p class="mt-1 text-sm opacity-90">${utils.escapeHtml(notification.message)}</p>` : ''}
                    ${actionsHTML}
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150" data-close="true">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    updateElement(element, notification) {
        element.innerHTML = this.getNotificationHTML(notification);
        this.addEventListeners(element, notification);
    }

    addEventListeners(element, notification) {
        // Close button
        const closeBtn = element.querySelector('[data-close="true"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.remove(notification.id);
            });
        }

        // Action buttons
        const actionBtns = element.querySelectorAll('[data-action]');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionId = e.target.getAttribute('data-action');
                const action = notification.actions.find(a => a.id === actionId);
                if (action && action.handler) {
                    action.handler(notification);
                }
                
                // Auto-close unless specified otherwise
                if (!action || action.autoClose !== false) {
                    this.remove(notification.id);
                }
            });
        });

        // Click to dismiss (if enabled)
        if (notification.clickToDismiss !== false) {
            element.addEventListener('click', (e) => {
                // Don't dismiss if clicking on action buttons
                if (!e.target.closest('button')) {
                    this.remove(notification.id);
                }
            });
        }
    }

    getNotificationStyles(type) {
        const styles = {
            success: 'bg-success-50 border-success-200 text-success-800',
            error: 'bg-error-50 border-error-200 text-error-800',
            warning: 'bg-warning-50 border-warning-200 text-warning-800',
            info: 'bg-primary-50 border-primary-200 text-primary-800'
        };
        return styles[type] || styles.info;
    }

    getIconStyles(type) {
        const styles = {
            success: 'text-success-400',
            error: 'text-error-400',
            warning: 'text-warning-400',
            info: 'text-primary-400'
        };
        return styles[type] || styles.info;
    }

    getIcon(type) {
        const icons = {
            success: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>`,
            error: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>`,
            warning: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>`,
            info: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>`
        };
        return icons[type] || icons.info;
    }

    // Convenience methods
    success(title, message, options = {}) {
        return this.add({
            type: 'success',
            title,
            message,
            ...options
        });
    }

    error(title, message, options = {}) {
        return this.add({
            type: 'error',
            title,
            message,
            persistent: true, // Errors should be persistent by default
            ...options
        });
    }

    warning(title, message, options = {}) {
        return this.add({
            type: 'warning',
            title,
            message,
            ...options
        });
    }

    info(title, message, options = {}) {
        return this.add({
            type: 'info',
            title,
            message,
            ...options
        });
    }

    // API response helpers
    handleApiError(error, defaultMessage = 'Si è verificato un errore') {
        let title = 'Errore';
        let message = defaultMessage;

        if (error.response) {
            // Server responded with error status
            title = `Errore ${error.response.status}`;
            message = error.response.data?.message || error.response.data?.error || defaultMessage;
        } else if (error.request) {
            // Network error
            title = 'Errore di Connessione';
            message = 'Impossibile connettersi al server. Controlla la tua connessione internet.';
        } else if (error.message) {
            // Other error
            message = error.message;
        }

        return this.error(title, message);
    }

    handleApiSuccess(message = 'Operazione completata con successo') {
        return this.success('Successo', message);
    }

    // Batch operations
    addMultiple(notifications) {
        return notifications.map(notification => this.add(notification));
    }

    // Configuration
    configure(options) {
        if (options.defaultDuration !== undefined) {
            this.defaultDuration = options.defaultDuration;
        }
        if (options.maxNotifications !== undefined) {
            this.maxNotifications = options.maxNotifications;
        }
        if (options.position) {
            this.setPosition(options.position);
        }
    }

    setPosition(position) {
        const positions = {
            'top-right': 'fixed top-4 right-4 z-50 space-y-2',
            'top-left': 'fixed top-4 left-4 z-50 space-y-2',
            'bottom-right': 'fixed bottom-4 right-4 z-50 space-y-2',
            'bottom-left': 'fixed bottom-4 left-4 z-50 space-y-2',
            'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2',
            'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2'
        };

        if (positions[position]) {
            this.container.className = positions[position];
        }
    }

    // Get notifications
    getAll() {
        return [...this.notifications];
    }

    getById(id) {
        return this.notifications.find(n => n.id === id);
    }

    getByType(type) {
        return this.notifications.filter(n => n.type === type);
    }

    // Clear methods
    clear() {
        this.removeAll();
    }

    clearByType(type) {
        this.removeByType(type);
    }

    // Statistics
    getStats() {
        const stats = {
            total: this.notifications.length,
            byType: {}
        };

        this.notifications.forEach(n => {
            stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
        });

        return stats;
    }
}

// Create and export a singleton instance
const notificationManager = new NotificationManager();

// Export to global scope
window.notifications = notificationManager;
window.NotificationManager = NotificationManager;

// Also create shorthand methods
window.notify = {
    success: (title, message, options) => notificationManager.success(title, message, options),
    error: (title, message, options) => notificationManager.error(title, message, options),
    warning: (title, message, options) => notificationManager.warning(title, message, options),
    info: (title, message, options) => notificationManager.info(title, message, options)
};