// Client-Side Router - Vanilla JavaScript replacement for React Router

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.currentParams = {};
        this.beforeRouteChange = [];
        this.afterRouteChange = [];
        this.notFoundHandler = null;
        this.init();
    }

    init() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            this.handleRoute(window.location.pathname, false);
        });

        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            // Ensure e.target is a valid DOM element with closest method
            if (!e.target || typeof e.target.closest !== 'function') {
                return;
            }
            
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                const path = link.getAttribute('data-route');
                this.navigate(path);
            }
        });

        // Note: Initial route handling is done after routes are registered
    }

    // Method to handle initial route after routes are registered
    handleInitialRoute() {
        this.handleRoute(window.location.pathname, false);
    }

    register(path, handler, options = {}) {
        const route = {
            path,
            handler,
            regex: this.pathToRegex(path),
            keys: [],
            ...options
        };

        // Extract parameter names from path
        const matches = path.match(/:([^/]+)/g);
        if (matches) {
            route.keys = matches.map(match => match.substring(1));
        }

        this.routes.set(path, route);
        return this;
    }

    pathToRegex(path) {
        // Convert path like '/products/:id' to regex
        const regexPath = path
            .replace(/\//g, '\\/')
            .replace(/:([^\/]+)/g, '([^\/]+)')
            .replace(/\*/g, '.*');
        
        return new RegExp(`^${regexPath}$`);
    }

    navigate(path, replace = false) {
        // Update browser history
        if (replace) {
            history.replaceState(null, '', path);
        } else {
            history.pushState(null, '', path);
        }
        
        this.handleRoute(path, true);
    }

    async handleRoute(path, addToHistory = true) {
        try {
            // Run before route change hooks
            for (const hook of this.beforeRouteChange) {
                const result = await hook(path, this.currentRoute);
                if (result === false) {
                    return; // Cancel navigation
                }
            }

            const matchedRoute = this.matchRoute(path);
            
            if (matchedRoute) {
                const { route, params } = matchedRoute;
                
                // Update current route info
                this.currentRoute = path;
                this.currentParams = params;
                
                // Update active navigation
                this.updateActiveNav(path);
                
                // Update state
                state.set('currentRoute', path);
                state.set('routeParams', params);
                
                // Execute route handler
                if (typeof route.handler === 'function') {
                    await route.handler(params, path);
                } else if (typeof route.handler === 'string') {
                    // If handler is a string, treat it as a page to load
                    await this.loadPage(route.handler, params);
                }
                
                // Run after route change hooks
                for (const hook of this.afterRouteChange) {
                    await hook(path, this.currentRoute, params);
                }
                
            } else {
                // No route matched, handle 404
                await this.handle404(path);
            }
            
        } catch (error) {
            console.error('Error handling route:', error);
            notifications.error('Errore di Navigazione', 'Si è verificato un errore durante la navigazione.');
        }
    }

    matchRoute(path) {
        console.log(`🔍 Matching path: "${path}"`);
        console.log(`📋 Available routes:`, Array.from(this.routes.keys()));
        
        for (const [routePath, route] of this.routes) {
            console.log(`🔎 Testing route: "${routePath}" with regex: ${route.regex}`);
            const match = path.match(route.regex);
            if (match) {
                console.log(`✅ Route matched: "${routePath}"`);
                const params = {};
                
                // Extract parameters
                route.keys.forEach((key, index) => {
                    params[key] = match[index + 1];
                });
                
                return { route, params };
            }
        }
        console.log(`❌ No route matched for path: "${path}"`);
        return null;
    }

    async loadPage(pageName, params = {}) {
        // This method is deprecated - we now use direct function handlers
        console.warn('loadPage is deprecated, use function handlers instead');
    }

    updateActiveNav(path) {
        // Remove active class from all nav items
        document.querySelectorAll('[data-route]').forEach(el => {
            el.classList.remove('bg-primary-100', 'text-primary-900');
            el.classList.add('text-gray-600');
            
            // Update SVG icons
            const svg = el.querySelector('svg');
            if (svg) {
                svg.classList.remove('text-primary-500');
                svg.classList.add('text-gray-400', 'group-hover:text-gray-500');
            }
        });

        // Add active class to current nav item
        const activeNavs = document.querySelectorAll(`[data-route]`);
        activeNavs.forEach(nav => {
            const navPath = nav.getAttribute('data-route');
            if (this.isActivePath(navPath, path)) {
                nav.classList.add('bg-primary-100', 'text-primary-900');
                nav.classList.remove('text-gray-600');
                
                // Update SVG icon
                const svg = nav.querySelector('svg');
                if (svg) {
                    svg.classList.add('text-primary-500');
                    svg.classList.remove('text-gray-400', 'group-hover:text-gray-500');
                }
            }
        });
    }

    isActivePath(navPath, currentPath) {
        // Exact match
        if (navPath === currentPath) {
            return true;
        }
        
        // Check if current path starts with nav path (for nested routes)
        if (currentPath.startsWith(navPath + '/')) {
            return true;
        }
        
        return false;
    }

    async handle404(path) {
        console.warn(`No route found for path: ${path}`);
        
        if (this.notFoundHandler) {
            await this.notFoundHandler(path);
        } else {
            // Default 404 handling
            notifications.warning('Pagina Non Trovata', `La pagina "${path}" non esiste.`);
            
            // Prevent infinite loop - only redirect if not already trying to go to dashboard
            if (path !== '/dashboard' && path !== '/') {
                window.location.href = '/dashboard';
            } else {
                // If dashboard route itself is not found, show error and stop
                console.error('Critical error: Dashboard route not registered');
                if (typeof notifications !== 'undefined') {
                    notifications.error('Errore Critico', 'Impossibile caricare la dashboard. Ricarica la pagina.');
                }
            }
        }
    }

    // Hook methods
    beforeEach(hook) {
        this.beforeRouteChange.push(hook);
        return this;
    }

    afterEach(hook) {
        this.afterRouteChange.push(hook);
        return this;
    }

    onNotFound(handler) {
        this.notFoundHandler = handler;
        return this;
    }

    // Utility methods
    getCurrentRoute() {
        return this.currentRoute;
    }

    getCurrentParams() {
        return { ...this.currentParams };
    }

    getRoutes() {
        return Array.from(this.routes.keys());
    }

    hasRoute(path) {
        return this.routes.has(path);
    }

    // Navigation guards
    addGuard(guard) {
        this.beforeEach(async (to, from) => {
            const result = await guard(to, from);
            return result;
        });
        return this;
    }

    // Query parameters
    getQueryParams() {
        return utils.getQueryParams();
    }

    setQueryParam(key, value) {
        utils.setQueryParam(key, value);
    }

    removeQueryParam(key) {
        utils.removeQueryParam(key);
    }

    // Hash handling
    getHash() {
        return window.location.hash.substring(1);
    }

    setHash(hash) {
        window.location.hash = hash;
    }

    // Programmatic navigation
    push(path) {
        this.navigate(path, false);
    }

    replace(path) {
        this.navigate(path, true);
    }

    back() {
        history.back();
    }

    forward() {
        history.forward();
    }

    go(delta) {
        history.go(delta);
    }

    // Route building
    buildPath(routeName, params = {}) {
        const route = Array.from(this.routes.values()).find(r => r.name === routeName);
        if (!route) {
            console.warn(`Route "${routeName}" not found`);
            return '/';
        }

        let path = route.path;
        Object.keys(params).forEach(key => {
            path = path.replace(`:${key}`, params[key]);
        });

        return path;
    }

    // Lazy loading
    lazy(importFn) {
        return async (params, path) => {
            try {
                state.set('loading', true);
                const module = await importFn();
                if (module.default) {
                    await module.default(params, path);
                }
            } catch (error) {
                console.error('Error loading lazy route:', error);
                notifications.error('Errore', 'Impossibile caricare la pagina.');
            } finally {
                state.set('loading', false);
            }
        };
    }

    // Middleware
    use(middleware) {
        this.beforeEach(middleware);
        return this;
    }

    // Debug
    debug() {
        console.group('Router Debug');
        console.log('Current Route:', this.currentRoute);
        console.log('Current Params:', this.currentParams);
        console.log('Registered Routes:', Array.from(this.routes.keys()));
        console.log('Before Hooks:', this.beforeRouteChange.length);
        console.log('After Hooks:', this.afterRouteChange.length);
        console.groupEnd();
    }
}

// Create and export a singleton instance
const router = new Router();

// Note: Routes are registered in app.js after all page objects are loaded

// Export to global scope
window.router = router;
window.Router = Router;

// Helper functions
window.navigateTo = (path) => router.navigate(path);
window.getCurrentRoute = () => router.getCurrentRoute();
window.getCurrentParams = () => router.getCurrentParams();