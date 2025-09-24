
# Technical Specification: React to Vanilla HTML+CSS+JS Migration - COMPLETED

## Overview

This document outlined the complete technical specification for migrating the inventory management system from React to vanilla HTML+CSS+JS with EJS templating, integrated into the existing Express backend.

**STATUS: MIGRATION COMPLETED** ✅

The React frontend has been successfully replaced with:
- EJS templating system
- Vanilla JavaScript with modular architecture
- Tailwind CSS for styling
- Custom state management and routing

## Current State Analysis

### React Application Structure
```
frontend/
├── src/
│   ├── App.tsx                    # Main app component with routing
│   ├── index.tsx                  # React DOM entry point
│   ├── components/
│   │   └── Layout/Layout.tsx      # Main layout with sidebar
│   ├── pages/                     # Page components
│   │   ├── Dashboard.tsx          # Statistics and overview
│   │   ├── Categories.tsx         # Category management
│   │   ├── Products.tsx           # Product management
│   │   ├── Images.tsx             # Image management
│   │   ├── Attributes.tsx         # Attribute management
│   │   └── ShopifyExport.tsx      # Shopify integration
│   ├── services/
│   │   └── api.ts                 # API service layer
│   ├── contexts/
│   │   └── NotificationContext.tsx # Toast notifications
│   ├── types/
│   │   └── index.ts               # TypeScript definitions
│   └── styles/
│       ├── App.css                # Component styles
│       └── index.css              # Global styles
└── public/                        # Static assets
```

### Key Features to Migrate
1. **Responsive Layout**: Sidebar navigation with mobile support
2. **Client-side Routing**: SPA navigation without page reloads
3. **API Integration**: REST API calls with error handling
4. **State Management**: Component state and context
5. **Notifications**: Toast notification system
6. **Form Handling**: CRUD operations with validation
7. **Image Upload**: File upload with preview
8. **Responsive Design**: Mobile-first approach

## Target Architecture

### New Directory Structure
```
backend/
├── views/                         # EJS templates
│   ├── layouts/
│   │   └── main.ejs              # Base layout template
│   ├── pages/
│   │   ├── dashboard.ejs         # Dashboard page
│   │   ├── categories.ejs        # Categories page
│   │   ├── products.ejs          # Products page
│   │   ├── images.ejs            # Images page
│   │   ├── attributes.ejs        # Attributes page
│   │   └── shopify.ejs           # Shopify page
│   └── partials/
│       ├── sidebar.ejs           # Navigation sidebar
│       ├── header.ejs            # Page header
│       ├── notifications.ejs     # Notification container
│       └── modals/               # Reusable modals
├── public/                        # Static assets
│   ├── css/
│   │   ├── main.css              # Main stylesheet
│   │   ├── components.css        # Component styles
│   │   ├── layout.css            # Layout styles
│   │   └── responsive.css        # Media queries
│   ├── js/
│   │   ├── app.js                # Main application entry
│   │   ├── core/
│   │   │   ├── router.js         # Client-side routing
│   │   │   ├── api.js            # API service layer
│   │   │   ├── state.js          # State management
│   │   │   ├── notifications.js  # Notification system
│   │   │   └── utils.js          # Utility functions
│   │   ├── components/
│   │   │   ├── sidebar.js        # Sidebar functionality
│   │   │   ├── modal.js          # Modal component
│   │   │   └── form.js           # Form utilities
│   │   └── pages/
│   │       ├── dashboard.js      # Dashboard logic
│   │       ├── categories.js     # Categories logic
│   │       ├── products.js       # Products logic
│   │       ├── images.js         # Images logic
│   │       ├── attributes.js     # Attributes logic
│   │       └── shopify.js        # Shopify logic
│   └── assets/
│       ├── icons/                # SVG icons
│       └── images/               # Static images
├── routes/
│   └── views.js                  # New route file for serving pages
└── app.js                        # Updated Express configuration
```

## Implementation Phases

### Phase 1: Backend Setup and Infrastructure

#### 1.1 Express Configuration Updates
```javascript
// app.js modifications
const express = require('express');
const path = require('path');

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Add view routes
const viewRoutes = require('./routes/views');
app.use('/', viewRoutes);
```

#### 1.2 Dependencies to Add
```json
{
  "dependencies": {
    "ejs": "^3.1.9"
  }
}
```

#### 1.3 View Routes Setup
```javascript
// routes/views.js
const express = require('express');
const router = express.Router();

// Main application route - serves all pages
router.get('/', (req, res) => {
  res.render('pages/dashboard', { 
    title: 'Dashboard',
    page: 'dashboard'
  });
});

router.get('/dashboard', (req, res) => {
  res.render('pages/dashboard', { 
    title: 'Dashboard',
    page: 'dashboard'
  });
});

router.get('/categories', (req, res) => {
  res.render('pages/categories', { 
    title: 'Categories',
    page: 'categories'
  });
});

// ... other routes

module.exports = router;
```

### Phase 2: Core Infrastructure Components

#### 2.1 Base Layout Template
```html
<!-- views/layouts/main.ejs -->
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %> - Inventory Manager</title>
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/layout.css">
    <link rel="stylesheet" href="/css/responsive.css">
</head>
<body>
    <div id="app" class="min-h-screen bg-gray-50">
        <%- include('../partials/sidebar', { currentPage: page }) %>
        
        <div class="main-content md:pl-64">
            <%- include('../partials/header', { title: title }) %>
            
            <main class="flex-1">
                <div class="py-6">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                        <%- body %>
                    </div>
                </div>
            </main>
        </div>
    </div>
    
    <%- include('../partials/notifications') %>
    
    <!-- Core JavaScript -->
    <script src="/js/core/utils.js"></script>
    <script src="/js/core/api.js"></script>
    <script src="/js/core/state.js"></script>
    <script src="/js/core/notifications.js"></script>
    <script src="/js/core/router.js"></script>
    <script src="/js/components/sidebar.js"></script>
    <script src="/js/components/modal.js"></script>
    <script src="/js/app.js"></script>
    
    <!-- Page-specific JavaScript -->
    <% if (page) { %>
        <script src="/js/pages/<%= page %>.js"></script>
    <% } %>
</body>
</html>
```

#### 2.2 Client-Side Router
```javascript
// public/js/core/router.js
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.init();
    }

    init() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            this.handleRoute(window.location.pathname);
        });

        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]')) {
                e.preventDefault();
                const path = e.target.getAttribute('data-route');
                this.navigate(path);
            }
        });

        // Handle initial route
        this.handleRoute(window.location.pathname);
    }

    register(path, handler) {
        this.routes.set(path, handler);
    }

    navigate(path) {
        history.pushState(null, '', path);
        this.handleRoute(path);
    }

    handleRoute(path) {
        // Update active navigation
        this.updateActiveNav(path);
        
        // Load page content if needed
        const handler = this.routes.get(path);
        if (handler) {
            handler();
        }
        
        this.currentRoute = path;
    }

    updateActiveNav(path) {
        // Remove active class from all nav items
        document.querySelectorAll('[data-route]').forEach(el => {
            el.classList.remove('bg-primary-100', 'text-primary-900');
            el.classList.add('text-gray-600');
        });

        // Add active class to current nav item
        const activeNav = document.querySelector(`[data-route="${path}"]`);
        if (activeNav) {
            activeNav.classList.add('bg-primary-100', 'text-primary-900');
            activeNav.classList.remove('text-gray-600');
        }
    }
}

// Global router instance
window.router = new Router();
```

#### 2.3 API Service Layer
```javascript
// public/js/core/api.js
class ApiService {
    constructor() {
        this.baseURL = '/api';
        this.timeout = 30000;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`API Request: ${config.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`API Response: ${response.status} ${url}`);
            
            return this.handleResponse(data);
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    handleResponse(response) {
        if (response.success && response.data !== undefined) {
            return response.data;
        }
        throw new Error(response.error || response.message || 'API request failed');
    }

    // Categories API
    async getCategories() {
        return this.request('/categories');
    }

    async getCategory(id) {
        return this.request(`/categories/${id}`);
    }

    async createCategory(data) {
        return this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCategory(id, data) {
        return this.request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteCategory(id) {
        return this.request(`/categories/${id}`, {
            method: 'DELETE'
        });
    }

    // Products API
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/products?${queryString}` : '/products';
        return this.request(endpoint);
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async createProduct(data) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateProduct(id, data) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    // Images API
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        return this.request('/images/upload', {
            method: 'POST',
            headers: {}, // Remove Content-Type to let browser set it
            body: formData
        });
    }

    async getImages(productId, variantId) {
        const params = {};
        if (productId) params.product_id = productId;
        if (variantId) params.variant_id = variantId;
        
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/images?${queryString}` : '/images';
        return this.request(endpoint);
    }

    // Health check
    async healthCheck() {
        const response = await fetch('/health');
        return response.json();
    }
}

// Global API service instance
window.api = new ApiService();
```

#### 2.4 State Management System
```javascript
// public/js/core/state.js
class StateManager {
    constructor() {
        this.state = {};
        this.listeners = new Map();
    }

    // Get state value
    get(key) {
        return this.state[key];
    }

    // Set state value and notify listeners
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                callback(value, oldValue);
            });
        }
    }

    // Subscribe to state changes
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    // Update state with object merge
    update(key, updates) {
        const current = this.get(key) || {};
        this.set(key, { ...current, ...updates });
    }

    // Initialize app state
    initializeState() {
        this.set('loading', false);
        this.set('user', null);
        this.set('notifications', []);
        this.set('currentPage', 'dashboard');
        this.set('sidebarOpen', false);
    }
}

// Global state manager instance
window.state = new StateManager();
window.state.initializeState();
```

#### 2.5 Notification System
```javascript
// public/js/core/notifications.js
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = null;
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
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = {
            ...notification,
            id,
            duration: notification.duration || 5000
        };

        this.notifications.push(newNotification);
        this.render(newNotification);

        // Auto remove notification
        if (newNotification.duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, newNotification.duration);
        }

        return id;
    }

    remove(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index > -1) {
            this.notifications.splice(index, 1);
            const element = document.getElementById(`notification-${id}`);
            if (element) {
                element.remove();
            }
        }
    }

    render(notification) {
        const element = document.createElement('div');
        element.id = `notification-${notification.id}`;
        element.className = `max-w-sm w-full border rounded-lg shadow-lg p-4 ${this.getNotificationStyles(notification.type)} animate-slide-up`;
        
        element.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0 ${this.getIconStyles(notification.type)}">
                    ${this.getIcon(notification.type)}
                </div>
                <div class="ml-3 w-0 flex-1">
                    <p class="text-sm font-medium">${notification.title}</p>
                    ${notification.message ? `<p class="mt-1 text-sm opacity-90">${notification.message}</p>` : ''}
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150" onclick="notifications.remove('${notification.id}')">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        this.container.appendChild(element);
    }

    getNotificationStyles(type) {
        switch (type) {
            case 'success': return 'bg-success-50 border-success-200 text-success-800';
            case 'error': return 'bg-error-50 border-error-200 text-error-800';
            case 'warning': return 'bg-warning-50 border-warning-200 text-warning-800';
            case 'info': return 'bg-primary-50 border-primary-200 text-primary-800';
            default: return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    }

    getIconStyles(type) {
        switch (type) {
            case 'success': return 'text-success-400';
            case 'error': return 'text-error-400';
            case 'warning': return 'text-warning-400';
            case 'info': return 'text-primary-400';
            default: return 'text-gray-400';
        }
    }

    getIcon(type) {
        switch (type) {
            case 'success':
                return '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
            case 'error':
                return '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';
            case 'warning':
                return '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
            case 'info':
                return '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>';
            default:
                return '';
        }
    }

    clear() {
        this.notifications = [];
        this.container.innerHTML = '';
    }
}

// Global notification manager instance
window.notifications = new NotificationManager();
```

### Phase 3: Page Templates and Components

#### 3.1 Dashboard Page Template
```html
<!-- views/pages/dashboard.ejs -->
<% layout('layouts/main') -%>

<div class="space-y-6" id="dashboard-content">
    <!-- Header -->
    <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="mt-1 text-sm text-gray-500">
            Panoramica del tuo inventario Shopify
        </p>
    </div>

    <!-- Loading State -->
    <div id="dashboard-loading" class="flex items-center justify-center h-64" style="display: none;">
        <div class="spinner"></div>
        <span class="ml-2 text-gray-600">Caricamento dashboard...</span>
    </div>

    <!-- Stats Grid -->
    <div id="stats-grid" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Stats cards will be populated by JavaScript -->
    </div>

    <!-- Recent Products and Categories -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Recent Products -->
        <div class="card">
            <div class="card-header">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium text-gray-900">Prodotti Recenti</h3>
                    <a href="#" data-route="/products" class="text-sm text-primary-600 hover:text-primary-500">
                        Vedi tutti
                    </a>
                </div>
            </div>
            <div class="card-body p-0" id="recent-products">
                <!-- Recent products will be populated by JavaScript -->
            </div>
        </div>

        <!-- Categories -->
        <div class="card">
            <div class="card-header">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium text-gray-900">Categorie</h3>
                    <a href="#" data-route="/categories" class="text-sm text-primary-600 hover:text-primary-500">
                        Gestisci
                    </a>
                </div>
            </div>
            <div class="card-body p-0" id="categories-list">
                <!-- Categories will be populated by JavaScript -->
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="card">
        <div class="card-header">
            <h3 class="text-lg font-medium text-gray-900">Azioni Rapide</h3>
        </div>
        <div class="card-body">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <a href="#" data-route="/categories" class="btn-outline text-center">
                    <svg class="mx-auto h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"></path>
                    </svg>
                    Gestisci Categorie
                </a>
                <a href="#" data-route="/products" class="btn-outline text-center">
                    <svg class="mx-auto h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    Aggiungi Prodotto
                </a>
                <a href="#" data-route="/images" class="btn-outline text-center">
                    <svg class="mx-auto h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Upload Immagini
                </a>
                <a href="#" data-route="/shopify" class="btn-outline text-center">
                    <svg class="mx-auto h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                    Export Shopify
                </a>
            </div>
        </div>
    </div>
</div>
```

#### 3.2 Dashboard JavaScript Logic
```javascript
// public/js/pages/dashboard.js
class DashboardPage {
    constructor() {
        this.stats = {
            categories: 0,
            products: 0,
            activeProducts: 0,
            draftProducts: 0,
            totalVariants: 0,
            totalImages: 0
        };
        this.recentProducts = [];
        this.categories = [];
        this.init();
    }

    async init() {
        await this.loadDashboardData();
        this.render();
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);
            
            // Load categories
            this.categories = await api.getCategories();
            
            // Load products with pagination
            const productsData = await api.getProducts({ limit: 5 });
            this.recentProducts = productsData.data || productsData;
            
            // Calculate stats
            const activeProducts = this.recentProducts.filter(p => p.status === 'active').length;
            const draftProducts = this.recentProducts.filter(p => p.status === 'draft').length;
            const totalVariants = this.recentProducts.reduce((sum, p) => sum + (p.variants?.length || 0), 0);
            const totalImages = this.recentProducts.reduce((sum, p) => sum + (p.images?.length || 0), 0);
            
            this.stats = {
                categories: this.categories.length,
                products: productsData.pagination?.total || this.recentProducts.length,
                activeProducts,
                draftProducts,
                totalVariants,
                totalImages
            };
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            notifications.add({
                type: 'error',
                title: 'Errore',
                message: 'Impossibile caricare i dati della dashboard'
            });
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loading = document.getElementById('dashboard-loading');
        const content = document.getElementById('dashboard-content');
        
        if (show) {
            loading.style.display = 'flex';
            content.style.display = 'none';
        } else {
            loading.style.display = 'none';
            content.style.display = 'block';
        }
    }

    render() {
        this.renderStats();
        this.renderRecentProducts();
        this.renderCategories();
    }

    renderStats()