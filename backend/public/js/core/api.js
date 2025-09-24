// API Service Layer - Vanilla JavaScript replacement for axios-based React service

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

    handlePaginatedResponse(response) {
        if (response.success) {
            return response;
        }
        throw new Error('API request failed');
    }

    // Categories API
    async getCategories(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/categories?${queryString}` : '/categories';
        const response = await this.request(endpoint);
        return this.handlePaginatedResponse(response);
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

    // Category Fields API
    async getCategoryFields(categoryId) {
        return this.request(`/categories/${categoryId}/fields`);
    }

    async createCategoryField(categoryId, data) {
        return this.request(`/categories/${categoryId}/fields`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCategoryField(categoryId, fieldId, data) {
        return this.request(`/categories/${categoryId}/fields/${fieldId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteCategoryField(categoryId, fieldId) {
        return this.request(`/categories/${categoryId}/fields/${fieldId}`, {
            method: 'DELETE'
        });
    }

    // Products API
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/products?${queryString}` : '/products';
        const response = await this.request(endpoint);
        return this.handlePaginatedResponse(response);
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

    // Variants API
    async getVariants(productId) {
        return this.request(`/products/${productId}/variants`);
    }

    async getVariant(productId, variantId) {
        return this.request(`/products/${productId}/variants/${variantId}`);
    }

    async createVariant(productId, data) {
        return this.request(`/products/${productId}/variants`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateVariant(productId, variantId, data) {
        return this.request(`/products/${productId}/variants/${variantId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteVariant(productId, variantId) {
        return this.request(`/products/${productId}/variants/${variantId}`, {
            method: 'DELETE'
        });
    }

    // Options API
    async getOptions(productId) {
        return this.request(`/products/${productId}/options`);
    }

    async createOption(productId, data) {
        return this.request(`/products/${productId}/options`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateOption(productId, optionId, data) {
        return this.request(`/products/${productId}/options/${optionId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteOption(productId, optionId) {
        return this.request(`/products/${productId}/options/${optionId}`, {
            method: 'DELETE'
        });
    }

    // Images API
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${this.baseURL}/images/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    async uploadMultipleImages(files) {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('images', file);
        });

        const response = await fetch(`${this.baseURL}/images/upload-multiple`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    async getImages(productId, variantId) {
        const params = {};
        if (productId) params.product_id = productId;
        if (variantId) params.variant_id = variantId;
        
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/images?${queryString}` : '/images';
        return this.request(endpoint);
    }

    async createImage(data) {
        return this.request('/images', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateImage(id, data) {
        return this.request(`/images/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteImage(id) {
        return this.request(`/images/${id}`, {
            method: 'DELETE'
        });
    }

    // Attributes API
    async getAttributes(productId, variantId) {
        const params = {};
        if (productId) params.product_id = productId;
        if (variantId) params.variant_id = variantId;
        
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/attributes?${queryString}` : '/attributes';
        return this.request(endpoint);
    }

    async createAttribute(data) {
        return this.request('/attributes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateAttribute(id, data) {
        return this.request(`/attributes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteAttribute(id) {
        return this.request(`/attributes/${id}`, {
            method: 'DELETE'
        });
    }

    // Shopify API
    async previewShopifyExport(productId) {
        return this.request(`/shopify/preview/${productId}`);
    }

    async exportToShopify(productId) {
        return this.request(`/shopify/export/${productId}`, {
            method: 'POST'
        });
    }

    async syncFromShopify(shopifyId) {
        return this.request(`/shopify/sync/${shopifyId}`, {
            method: 'POST'
        });
    }

    // Health check
    async healthCheck() {
        const response = await fetch('/health');
        return response.json();
    }

    // Batch operations
    async batchRequest(requests) {
        const promises = requests.map(req => 
            this.request(req.endpoint, req.options).catch(error => ({ error, request: req }))
        );
        
        return Promise.all(promises);
    }

    // Search functionality
    async search(query, type = 'all') {
        const params = { q: query, type };
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/search?${queryString}`);
    }

    // Statistics
    async getStats() {
        return this.request('/stats');
    }

    async getDashboardStats() {
        return this.request('/stats/dashboard');
    }

    // Export/Import
    async exportData(type, format = 'json') {
        const params = { type, format };
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseURL}/export?${queryString}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (format === 'json') {
            return response.json();
        } else {
            return response.blob();
        }
    }

    async importData(file, type) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await fetch(`${this.baseURL}/import`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    // Utility methods
    buildQueryString(params) {
        return new URLSearchParams(params).toString();
    }

    async downloadFile(url, filename) {
        const response = await fetch(url);
        const blob = await response.blob();
        
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        
        window.URL.revokeObjectURL(link.href);
    }

    // Request interceptors
    addRequestInterceptor(interceptor) {
        // Store interceptor for future use
        this.requestInterceptors = this.requestInterceptors || [];
        this.requestInterceptors.push(interceptor);
    }

    addResponseInterceptor(interceptor) {
        // Store interceptor for future use
        this.responseInterceptors = this.responseInterceptors || [];
        this.responseInterceptors.push(interceptor);
    }

    // Error handling
    handleError(error) {
        if (error.name === 'AbortError') {
            console.log('Request was aborted');
        } else if (error.message.includes('Failed to fetch')) {
            console.error('Network error - check your connection');
        } else {
            console.error('API Error:', error.message);
        }
        throw error;
    }
}

// Create and export a singleton instance
const apiService = new ApiService();

// Export to global scope
window.api = apiService;

// Also export the class for potential extension
window.ApiService = ApiService;