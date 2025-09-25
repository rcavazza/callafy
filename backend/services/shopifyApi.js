const axios = require('axios');
const logger = require('../config/logger');

class ShopifyApiClient {
  constructor() {
    this.shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    this.apiVersion = process.env.SHOPIFY_API_VERSION || '2025-01';
    
    if (!this.shopDomain || !this.accessToken) {
      logger.warn('Shopify credentials not configured. Export functionality will be disabled.');
    }
    
    this.baseURL = `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
    this.headers = {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json'
    };

    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: this.headers,
      timeout: 30000 // 30 seconds timeout
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`Shopify API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Shopify API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`Shopify API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if Shopify API is configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!(this.shopDomain && this.accessToken);
  }

  /**
   * Handle Shopify API errors
   * @param {Object} error - Axios error object
   */
  handleApiError(error) {
    if (error.response) {
      const { status, data } = error.response;
      logger.error(`Shopify API Error ${status}:`, data);
      
      // Handle rate limiting
      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        logger.warn(`Rate limited. Retry after ${retryAfter} seconds`);
      }
      
      // Handle authentication errors
      if (status === 401) {
        logger.error('Shopify authentication failed. Check access token.');
      }
      
      // Handle not found errors
      if (status === 404) {
        logger.error('Shopify resource not found.');
      }
    } else if (error.request) {
      logger.error('Shopify API Network Error:', error.message);
    } else {
      logger.error('Shopify API Error:', error.message);
    }
  }

  /**
   * Create a new product in Shopify
   * @param {Object} productData - Shopify-formatted product data
   * @returns {Promise<Object>} Shopify product response
   */
  async createProduct(productData) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info('Creating product in Shopify:', productData.product.title);
      
      const response = await this.client.post('/products.json', productData);
      
      logger.info(`Product created in Shopify with ID: ${response.data.product.id}`);
      return response.data;

    } catch (error) {
      logger.error('Error creating product in Shopify:', error.message);
      throw this.createShopifyError('Failed to create product', error);
    }
  }

  /**
   * Update an existing product in Shopify
   * @param {number} shopifyId - Shopify product ID
   * @param {Object} productData - Shopify-formatted product data
   * @returns {Promise<Object>} Shopify product response
   */
  async updateProduct(shopifyId, productData) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`Updating product ${shopifyId} in Shopify`);
      
      const response = await this.client.put(`/products/${shopifyId}.json`, productData);
      
      logger.info(`Product ${shopifyId} updated in Shopify`);
      return response.data;

    } catch (error) {
      logger.error(`Error updating product ${shopifyId} in Shopify:`, error.message);
      throw this.createShopifyError('Failed to update product', error);
    }
  }

  /**
   * Get a product from Shopify
   * @param {number} shopifyId - Shopify product ID
   * @returns {Promise<Object>} Shopify product data
   */
  async getProduct(shopifyId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`Fetching product ${shopifyId} from Shopify`);
      
      const response = await this.client.get(`/products/${shopifyId}.json`);
      
      return response.data;

    } catch (error) {
      logger.error(`Error fetching product ${shopifyId} from Shopify:`, error.message);
      throw this.createShopifyError('Failed to fetch product', error);
    }
  }

  /**
   * Delete a product from Shopify
   * @param {number} shopifyId - Shopify product ID
   * @returns {Promise<void>}
   */
  async deleteProduct(shopifyId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`Deleting product ${shopifyId} from Shopify`);
      
      await this.client.delete(`/products/${shopifyId}.json`);
      
      logger.info(`Product ${shopifyId} deleted from Shopify`);

    } catch (error) {
      logger.error(`Error deleting product ${shopifyId} from Shopify:`, error.message);
      throw this.createShopifyError('Failed to delete product', error);
    }
  }

  /**
   * Get all products from Shopify (with pagination)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Shopify products response
   */
  async getProducts(options = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      const params = {
        limit: options.limit || 50,
        ...options
      };

      logger.info('Fetching products from Shopify');
      
      const response = await this.client.get('/products.json', { params });
      
      return response.data;

    } catch (error) {
      logger.error('Error fetching products from Shopify:', error.message);
      throw this.createShopifyError('Failed to fetch products', error);
    }
  }

  /**
   * Update product inventory
   * @param {number} variantId - Shopify variant ID
   * @param {number} quantity - New inventory quantity
   * @returns {Promise<Object>} Updated variant data
   */
  async updateInventory(variantId, quantity) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`Updating inventory for variant ${variantId} to ${quantity}`);
      
      const response = await this.client.put(`/variants/${variantId}.json`, {
        variant: {
          id: variantId,
          inventory_quantity: quantity
        }
      });
      
      logger.info(`Inventory updated for variant ${variantId}`);
      return response.data;

    } catch (error) {
      logger.error(`Error updating inventory for variant ${variantId}:`, error.message);
      throw this.createShopifyError('Failed to update inventory', error);
    }
  }

  /**
   * Test Shopify API connection
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Shopify API not configured'
        };
      }

      logger.info('Testing Shopify API connection');
      
      const response = await this.client.get('/shop.json');
      
      return {
        success: true,
        shop: response.data.shop,
        message: 'Connection successful'
      };

    } catch (error) {
      logger.error('Shopify API connection test failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Shopify API rate limit status
   * @returns {Promise<Object>} Rate limit information
   */
  async getRateLimitStatus() {
    try {
      const response = await this.client.get('/shop.json');
      
      const rateLimitHeader = response.headers['x-shopify-shop-api-call-limit'];
      if (rateLimitHeader) {
        const [used, total] = rateLimitHeader.split('/').map(Number);
        return {
          used,
          total,
          remaining: total - used,
          percentage: (used / total) * 100
        };
      }
      
      return null;

    } catch (error) {
      logger.error('Error getting rate limit status:', error.message);
      return null;
    }
  }

  /**
   * Create a standardized Shopify error
   * @param {string} message - Error message
   * @param {Object} originalError - Original error object
   * @returns {Error} Standardized error
   */
  createShopifyError(message, originalError) {
    const error = new Error(message);
    error.name = 'ShopifyApiError';
    error.originalError = originalError;
    
    if (originalError.response) {
      error.status = originalError.response.status;
      error.shopifyErrors = originalError.response.data?.errors;
    }
    
    return error;
  }

  /**
   * Retry a failed request with exponential backoff
   * @param {Function} requestFn - Function that makes the request
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<any>} Request result
   */
  async retryRequest(requestFn, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Create a new variant in an existing product
   * @param {number} productId - Shopify product ID
   * @param {Object} variantData - Shopify-formatted variant data
   * @returns {Promise<Object>} Shopify variant response
   */
  async createVariantInProduct(productId, variantData) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`Creating variant in product ${productId}`);
      
      const response = await this.client.post(`/products/${productId}/variants.json`, variantData);
      
      logger.info(`Variant created in product ${productId} with ID: ${response.data.variant.id}`);
      return response.data;

    } catch (error) {
      logger.error(`Error creating variant in product ${productId}:`, error.message);
      throw this.createShopifyError('Failed to create variant', error);
    }
  }

  /**
   * Update an existing variant
   * @param {number} variantId - Shopify variant ID
   * @param {Object} variantData - Shopify-formatted variant data
   * @returns {Promise<Object>} Shopify variant response
   */
  async updateVariant(variantId, variantData) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`Updating variant ${variantId}`);
      
      const response = await this.client.put(`/variants/${variantId}.json`, variantData);
      
      logger.info(`Variant ${variantId} updated successfully`);
      return response.data;

    } catch (error) {
      logger.error(`Error updating variant ${variantId}:`, error.message);
      throw this.createShopifyError('Failed to update variant', error);
    }
  }

  /**
   * Get a variant from Shopify
   * @param {number} variantId - Shopify variant ID
   * @returns {Promise<Object>} Shopify variant data
   */
  async getVariant(variantId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`Fetching variant ${variantId} from Shopify`);
      
      const response = await this.client.get(`/variants/${variantId}.json`);
      
      return response.data;

    } catch (error) {
      logger.error(`Error fetching variant ${variantId} from Shopify:`, error.message);
      throw this.createShopifyError('Failed to fetch variant', error);
    }
  }

  /**
   * Delete a variant from Shopify
   * @param {number} productId - Shopify product ID
   * @param {number} variantId - Shopify variant ID
   * @returns {Promise<void>}
   */
  async deleteVariant(productId, variantId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`Deleting variant ${variantId} from product ${productId}`);
      
      await this.client.delete(`/products/${productId}/variants/${variantId}.json`);
      
      logger.info(`Variant ${variantId} deleted from Shopify`);

    } catch (error) {
      logger.error(`Error deleting variant ${variantId}:`, error.message);
      throw this.createShopifyError('Failed to delete variant', error);
    }
  }
}

module.exports = ShopifyApiClient;