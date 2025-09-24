// Modal Component - Vanilla JavaScript modal system

class ModalComponent {
    constructor() {
        this.modals = new Map();
        this.activeModal = null;
        this.init();
    }

    init() {
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close(this.activeModal);
            }
        });

        // Handle click outside modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') && this.activeModal) {
                const modal = this.modals.get(this.activeModal);
                if (modal && modal.options.closeOnOverlayClick !== false) {
                    this.close(this.activeModal);
                }
            }
        });
    }

    create(id, options = {}) {
        const defaultOptions = {
            title: '',
            content: '',
            size: 'md',
            closeOnOverlayClick: true,
            closeOnEscape: true,
            showCloseButton: true,
            buttons: [],
            onShow: null,
            onHide: null,
            onConfirm: null,
            onCancel: null
        };

        const modalOptions = { ...defaultOptions, ...options };
        
        const modal = {
            id,
            options: modalOptions,
            element: null,
            isVisible: false
        };

        this.modals.set(id, modal);
        return modal;
    }

    show(id, options = {}) {
        let modal = this.modals.get(id);
        
        if (!modal) {
            modal = this.create(id, options);
        } else if (Object.keys(options).length > 0) {
            // Update options if provided
            modal.options = { ...modal.options, ...options };
        }

        if (modal.isVisible) {
            return modal;
        }

        // Close any active modal first
        if (this.activeModal && this.activeModal !== id) {
            this.close(this.activeModal);
        }

        this.render(modal);
        this.activeModal = id;
        modal.isVisible = true;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus management
        this.trapFocus(modal);

        // Trigger callback
        if (modal.options.onShow) {
            modal.options.onShow(modal);
        }

        // Update state
        state.update('ui', { 
            modals: { 
                ...state.get('ui').modals, 
                [id]: { visible: true, ...modal.options } 
            } 
        });

        return modal;
    }

    close(id) {
        const modal = this.modals.get(id);
        if (!modal || !modal.isVisible) {
            return;
        }

        modal.isVisible = false;
        
        if (modal.element) {
            // Add closing animation
            modal.element.classList.add('opacity-0');
            
            setTimeout(() => {
                if (modal.element && modal.element.parentNode) {
                    modal.element.parentNode.removeChild(modal.element);
                }
                modal.element = null;
            }, 150);
        }

        // Restore body scroll
        document.body.style.overflow = '';

        // Clear active modal
        if (this.activeModal === id) {
            this.activeModal = null;
        }

        // Trigger callback
        if (modal.options.onHide) {
            modal.options.onHide(modal);
        }

        // Update state
        const uiState = state.get('ui');
        const modals = { ...uiState.modals };
        delete modals[id];
        state.update('ui', { modals });
    }

    render(modal) {
        // Remove existing element if any
        if (modal.element) {
            modal.element.remove();
        }

        // Create modal element
        modal.element = utils.createElement('div', {
            className: 'modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 opacity-0 transition-opacity duration-150',
            'data-modal-id': modal.id
        });

        const sizeClasses = {
            sm: 'max-w-sm',
            md: 'max-w-md',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl',
            full: 'max-w-full mx-4'
        };

        const contentElement = utils.createElement('div', {
            className: `modal-content bg-white rounded-lg shadow-xl ${sizeClasses[modal.options.size]} w-full max-h-screen overflow-y-auto transform scale-95 transition-transform duration-150`
        });

        // Header
        if (modal.options.title || modal.options.showCloseButton) {
            const header = utils.createElement('div', {
                className: 'modal-header flex items-center justify-between p-6 border-b border-gray-200'
            });

            if (modal.options.title) {
                const title = utils.createElement('h3', {
                    className: 'text-lg font-semibold text-gray-900'
                }, modal.options.title);
                header.appendChild(title);
            }

            if (modal.options.showCloseButton) {
                const closeBtn = utils.createElement('button', {
                    className: 'text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150',
                    'data-close': 'true'
                }, `
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                `);
                
                closeBtn.addEventListener('click', () => this.close(modal.id));
                header.appendChild(closeBtn);
            }

            contentElement.appendChild(header);
        }

        // Body
        if (modal.options.content) {
            const body = utils.createElement('div', {
                className: 'modal-body p-6'
            });

            if (typeof modal.options.content === 'string') {
                body.innerHTML = modal.options.content;
            } else if (modal.options.content instanceof HTMLElement) {
                body.appendChild(modal.options.content);
            }

            contentElement.appendChild(body);
        }

        // Footer with buttons
        if (modal.options.buttons && modal.options.buttons.length > 0) {
            const footer = utils.createElement('div', {
                className: 'modal-footer flex justify-end gap-3 p-6 border-t border-gray-200'
            });

            modal.options.buttons.forEach(button => {
                const btn = utils.createElement('button', {
                    className: `btn ${button.class || 'btn-primary'}`,
                    'data-action': button.action || 'close'
                }, button.text);

                btn.addEventListener('click', () => {
                    if (button.handler) {
                        const result = button.handler(modal);
                        if (result !== false && button.action !== 'keep-open') {
                            this.close(modal.id);
                        }
                    } else if (button.action === 'close') {
                        this.close(modal.id);
                    }
                });

                footer.appendChild(btn);
            });

            contentElement.appendChild(footer);
        }

        modal.element.appendChild(contentElement);
        document.body.appendChild(modal.element);

        // Trigger animations
        requestAnimationFrame(() => {
            modal.element.classList.remove('opacity-0');
            modal.element.classList.add('opacity-100');
            contentElement.classList.remove('scale-95');
            contentElement.classList.add('scale-100');
        });
    }

    trapFocus(modal) {
        if (!modal.element) return;

        const focusableElements = modal.element.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        };

        document.addEventListener('keydown', handleTabKey);

        // Focus first element
        if (firstFocusableElement) {
            firstFocusableElement.focus();
        }

        // Store cleanup function
        modal.focusCleanup = () => {
            document.removeEventListener('keydown', handleTabKey);
        };
    }

    // Convenience methods
    alert(title, message, options = {}) {
        return this.show('alert', {
            title,
            content: `<p class="text-gray-700">${utils.escapeHtml(message)}</p>`,
            buttons: [
                {
                    text: 'OK',
                    class: 'btn-primary',
                    action: 'close'
                }
            ],
            ...options
        });
    }

    confirm(title, message, options = {}) {
        return new Promise((resolve) => {
            this.show('confirm', {
                title,
                content: `<p class="text-gray-700">${utils.escapeHtml(message)}</p>`,
                buttons: [
                    {
                        text: 'Annulla',
                        class: 'btn-outline',
                        handler: () => {
                            resolve(false);
                        }
                    },
                    {
                        text: 'Conferma',
                        class: 'btn-primary',
                        handler: () => {
                            resolve(true);
                        }
                    }
                ],
                closeOnOverlayClick: false,
                ...options
            });
        });
    }

    prompt(title, message, defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            const inputId = utils.generateId();
            
            this.show('prompt', {
                title,
                content: `
                    <div class="space-y-4">
                        <p class="text-gray-700">${utils.escapeHtml(message)}</p>
                        <input type="text" id="${inputId}" class="form-input w-full" value="${utils.escapeHtml(defaultValue)}" />
                    </div>
                `,
                buttons: [
                    {
                        text: 'Annulla',
                        class: 'btn-outline',
                        handler: () => {
                            resolve(null);
                        }
                    },
                    {
                        text: 'OK',
                        class: 'btn-primary',
                        handler: () => {
                            const input = document.getElementById(inputId);
                            resolve(input ? input.value : '');
                        }
                    }
                ],
                onShow: () => {
                    const input = document.getElementById(inputId);
                    if (input) {
                        input.focus();
                        input.select();
                    }
                },
                closeOnOverlayClick: false,
                ...options
            });
        });
    }

    // Utility methods
    isVisible(id) {
        const modal = this.modals.get(id);
        return modal ? modal.isVisible : false;
    }

    getActive() {
        return this.activeModal;
    }

    closeAll() {
        Array.from(this.modals.keys()).forEach(id => {
            this.close(id);
        });
    }

    destroy(id) {
        this.close(id);
        this.modals.delete(id);
    }

    destroyAll() {
        this.closeAll();
        this.modals.clear();
    }
}

// Create modal instance
const modalComponent = new ModalComponent();

// Export to global scope
window.modal = modalComponent;
window.ModalComponent = ModalComponent;

// Convenience global functions
window.showModal = (id, options) => modalComponent.show(id, options);
window.closeModal = (id) => modalComponent.close(id);
window.alert = (title, message, options) => modalComponent.alert(title, message, options);
window.confirm = (title, message, options) => modalComponent.confirm(title, message, options);
window.prompt = (title, message, defaultValue, options) => modalComponent.prompt(title, message, defaultValue, options);