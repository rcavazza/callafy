// Main Application Entry Point

class App {
    constructor() {
        this.initialized = false;
        this.version = '1.0.0';
        this.environment = window.location.hostname === 'localhost' ? 'development' : 'production';
    }

    async init() {
        if (this.initialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            console.log(`🚀 Initializing Inventory Manager v${this.version} (${this.environment})`);
            
            // Initialize core systems
            await this.initializeCore();
            
            // Initialize components
            this.initializeComponents();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            // Initialize router
            this.initializeRouter();
            
            // Perform health check
            await this.performHealthCheck();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('✅ App initialized successfully');
            
            // Show welcome notification in development
            if (this.environment === 'development') {
                notifications.info('Sistema Avviato', 'Inventory Manager è pronto all\'uso!');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.handleInitializationError(error);
        }
    }

    async initializeCore() {
        // Initialize state management
        if (!window.state) {
            throw new Error('State manager not available');
        }
        
        // Initialize API service
        if (!window.api) {
            throw new Error('API service not available');
        }
        
        // Initialize notifications
        if (!window.notifications) {
            throw new Error('Notification system not available');
        }
        
        // Initialize utilities
        if (!window.utils) {
            throw new Error('Utilities not available');
        }
        
        console.log('✅ Core systems initialized');
    }

    initializeComponents() {
        // Initialize sidebar component
        if (window.sidebar) {
            console.log('✅ Sidebar component initialized');
        }
        
        // Initialize modal component
        if (window.modal) {
            console.log('✅ Modal component initialized');
        }
        
        // Initialize other components as needed
        this.initializeFormValidation();
        this.initializeTooltips();
        this.initializeDropdowns();
    }

    initializeEventListeners() {
        // Global error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });

        // Online/offline status
        window.addEventListener('online', () => {
            notifications.success('Connessione Ripristinata', 'Sei di nuovo online!');
            state.set('online', true);
        });

        window.addEventListener('offline', () => {
            notifications.warning('Connessione Persa', 'Sei offline. Alcune funzionalità potrebbero non essere disponibili.');
            state.set('online', false);
        });

        // Visibility change (tab focus/blur)
        document.addEventListener('visibilitychange', () => {
            state.set('documentVisible', !document.hidden);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        console.log('✅ Event listeners initialized');
    }

    initializeRouter() {
        if (!window.router) {
            throw new Error('Router not available');
        }
        
        // Register routes
        this.registerRoutes();
        
        // Add global route guards
        router.beforeEach(async (to, from) => {
            // Set loading state
            state.set('loading', true);
            
            // Clear any existing errors
            state.set('errors', {});
            
            return true;
        });

        router.afterEach(async (to, from) => {
            // Clear loading state
            state.set('loading', false);
            
            // Update page title
            this.updatePageTitle(to);
            
            // Track page view (if analytics enabled)
            this.trackPageView(to);
        });

        // Handle initial route after all routes are registered
        router.handleInitialRoute();

        console.log('✅ Router initialized');
    }

    registerRoutes() {
        // Register application routes (overriding defaults where needed)
        router.register('/', async () => {
            console.log('🏠 Navigating to Dashboard');
            await this.loadDashboard();
        });

        router.register('/dashboard', async () => {
            console.log('🏠 Navigating to Dashboard');
            await this.loadDashboard();
        });

        router.register('/categories', async () => {
            console.log('📂 Navigating to Categories');
            await this.loadCategories();
        });

        router.register('/products', async () => {
            console.log('📦 Navigating to Products');
            await this.loadProducts();
        });

        router.register('/products/:id', async (params) => {
            console.log('📦 Navigating to Product Detail:', params.id);
            await this.loadProductDetail(params.id);
        });

        router.register('/images', async () => {
            console.log('🖼️ Navigating to Images');
            await this.loadImages();
        });

        router.register('/attributes', async () => {
            console.log('🏷️ Navigating to Attributes');
            await this.loadAttributes();
        });

        router.register('/shopify', async () => {
            console.log('🛒 Navigating to Shopify Export');
            await this.loadShopifyExport();
        });

        console.log('✅ Routes registered');
    }

    async loadDashboard() {
        // Dashboard is now self-contained, redirect to dashboard route
        window.location.href = '/dashboard';
    }

    async loadCategories() {
        // Categories page should be loaded statically in the layout
        if (!window.categoriesPage) {
            console.error('❌ Categories page not found. Make sure categories-simple.js is loaded in the layout.');
            notifications.error('Errore', 'Impossibile trovare la pagina categorie');
            return;
        }
        
        // Categories page initialization
        try {
            console.log('📂 Initializing categories page...');
            await window.categoriesPage.init();
        } catch (error) {
            console.error('❌ Error initializing categories page:', error);
            notifications.error('Errore', 'Impossibile inizializzare la pagina categorie');
        }
    }

    async loadProducts() {
        // TODO: Implement products page loading
        notifications.info('In Sviluppo', 'La pagina Prodotti è in fase di sviluppo.');
    }

    async loadProductDetail(id) {
        // TODO: Implement product detail page loading
        notifications.info('In Sviluppo', `La pagina Dettaglio Prodotto (${id}) è in fase di sviluppo.`);
    }

    async loadImages() {
        // TODO: Implement images page loading
        notifications.info('In Sviluppo', 'La pagina Immagini è in fase di sviluppo.');
    }

    async loadAttributes() {
        // TODO: Implement attributes page loading
        notifications.info('In Sviluppo', 'La pagina Attributi è in fase di sviluppo.');
    }

    async loadShopifyExport() {
        // TODO: Implement shopify export page loading
        notifications.info('In Sviluppo', 'La pagina Esportazione Shopify è in fase di sviluppo.');
    }

    async performHealthCheck() {
        try {
            const health = await api.healthCheck();
            console.log('✅ Backend health check passed:', health);
            state.set('backendHealthy', true);
        } catch (error) {
            console.warn('⚠️ Backend health check failed:', error);
            state.set('backendHealthy', false);
            notifications.warning('Avviso', 'Problemi di connessione con il server. Alcune funzionalità potrebbero non funzionare correttamente.');
        }
    }

    handleInitializationError(error) {
        // Show error to user
        const errorMessage = error.message || 'Errore sconosciuto durante l\'inizializzazione';
        
        // Try to show notification if available
        if (window.notifications) {
            notifications.error('Errore di Inizializzazione', errorMessage);
        } else {
            // Fallback to alert
            alert(`Errore di Inizializzazione: ${errorMessage}`);
        }
        
        // Set error state if state manager is available
        if (window.state) {
            state.set('initializationError', error);
        }
    }

    handleGlobalError(error) {
        // Don't show notifications for every error in production
        if (this.environment === 'development') {
            notifications.error('Errore', error.message || 'Si è verificato un errore imprevisto');
        }
        
        // Log to state for debugging
        if (window.state) {
            const errors = state.get('errors') || {};
            errors[Date.now()] = {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };
            state.set('errors', errors);
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search (future feature)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            // TODO: Open search modal
            console.log('Search shortcut triggered');
        }
        
        // Ctrl/Cmd + / for help (future feature)
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            // TODO: Open help modal
            console.log('Help shortcut triggered');
        }
        
        // Alt + D for dashboard
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            window.location.href = '/dashboard';
        }
        
        // Alt + P for products
        if (e.altKey && e.key === 'p') {
            e.preventDefault();
            router.navigate('/products');
        }
        
        // Alt + C for categories
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            router.navigate('/categories');
        }
    }

    updatePageTitle(route) {
        const routeTitles = {
            '/dashboard': 'Dashboard',
            '/categories': 'Categorie',
            '/products': 'Prodotti',
            '/images': 'Immagini',
            '/attributes': 'Attributi',
            '/shopify': 'Export Shopify'
        };
        
        const title = routeTitles[route] || 'Inventory Manager';
        document.title = `${title} - Inventory Manager`;
    }

    trackPageView(route) {
        // Placeholder for analytics tracking
        if (this.environment === 'development') {
            console.log(`📊 Page view: ${route}`);
        }
        
        // TODO: Implement actual analytics tracking
        // Example: gtag('config', 'GA_MEASUREMENT_ID', { page_path: route });
    }

    initializeFormValidation() {
        // Add global form validation
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.hasAttribute('data-validate')) {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            }
        });
    }

    validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'Questo campo è obbligatorio');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });
        
        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('form-error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.form-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorElement = utils.createElement('div', {
            className: 'form-error-message text-sm text-red-600 mt-1'
        }, message);
        
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.classList.remove('form-error');
        const errorMessage = field.parentNode.querySelector('.form-error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    initializeTooltips() {
        // Simple tooltip implementation
        document.addEventListener('mouseenter', (e) => {
            const element = e.target.closest('[data-tooltip]');
            if (element) {
                this.showTooltip(element);
            }
        });

        document.addEventListener('mouseleave', (e) => {
            const element = e.target.closest('[data-tooltip]');
            if (element) {
                this.hideTooltip(element);
            }
        });
    }

    showTooltip(element) {
        const text = element.getAttribute('data-tooltip');
        if (!text) return;

        const tooltip = utils.createElement('div', {
            className: 'tooltip absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none',
            id: 'tooltip'
        }, text);

        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    initializeDropdowns() {
        // Simple dropdown implementation
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-dropdown-trigger]');
            if (trigger) {
                e.preventDefault();
                const dropdownId = trigger.getAttribute('data-dropdown-trigger');
                this.toggleDropdown(dropdownId);
            } else {
                // Close all dropdowns when clicking outside
                this.closeAllDropdowns();
            }
        });
    }

    toggleDropdown(id) {
        const dropdown = document.querySelector(`[data-dropdown="${id}"]`);
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('[data-dropdown]').forEach(dropdown => {
            dropdown.classList.add('hidden');
        });
    }

    // Dynamic script loading
    async loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                console.log(`✅ Script loaded: ${src}`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ Failed to load script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    // Public API methods
    getVersion() {
        return this.version;
    }

    getEnvironment() {
        return this.environment;
    }

    isInitialized() {
        return this.initialized;
    }

    restart() {
        console.log('🔄 Restarting application...');
        window.location.reload();
    }
}

// Create app instance
const app = new App();

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export to global scope
window.app = app;
window.App = App;

// Development helpers
if (app.getEnvironment() === 'development') {
    window.debug = {
        state: () => state.debug(),
        router: () => router.debug(),
        notifications: () => notifications.getStats(),
        app: () => app
    };
}