const axios = require('axios');
const fs = require('fs');
const path = require('path');
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

      logger.info(`🚀 [CREATE_PRODUCT] Creating product in Shopify: "${productData.product.title}"`);
      logger.info(`🔍 [CREATE_PRODUCT] Product data summary:`, {
        title: productData.product.title,
        variants_count: productData.product.variants?.length || 0,
        options_count: productData.product.options?.length || 0,
        metafields_count: productData.product.metafields?.length || 0,
        has_handle: !!productData.product.handle,
        status: productData.product.status
      });
      
      // Log the full product data for debugging (but sanitize sensitive info)
      logger.debug(`🔍 [CREATE_PRODUCT] Full product data:`, JSON.stringify(productData, null, 2));
      
      const response = await this.client.post('/products.json', productData);
      
      logger.info(`✅ [CREATE_PRODUCT] Product created successfully with ID: ${response.data.product.id}`);
      return response.data;

    } catch (error) {
      logger.error(`❌ [CREATE_PRODUCT] Error creating product in Shopify:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        shopifyErrors: error.response?.data?.errors,
        shopifyData: error.response?.data
      });
      
      // Log the product data that caused the error
      if (error.response?.status >= 400) {
        logger.error(`❌ [CREATE_PRODUCT] Product data that caused error:`, JSON.stringify(productData, null, 2));
      }
      
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
        logger.warn('🔧 [TEST_CONNECTION] Shopify API not configured');
        return {
          success: false,
          error: 'Shopify API not configured - check SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN'
        };
      }

      logger.info('🔗 [TEST_CONNECTION] Testing Shopify API connection...');
      logger.info(`🔗 [TEST_CONNECTION] Shop domain: ${this.shopDomain}`);
      logger.info(`🔗 [TEST_CONNECTION] API version: ${this.apiVersion}`);
      
      const response = await this.client.get('/shop.json');
      
      logger.info(`✅ [TEST_CONNECTION] Connection successful to shop: ${response.data.shop.name}`);
      
      return {
        success: true,
        shop: response.data.shop,
        message: 'Connection successful'
      };

    } catch (error) {
      logger.error('❌ [TEST_CONNECTION] Shopify API connection test failed:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        shopifyErrors: error.response?.data?.errors,
        baseURL: this.baseURL
      });
      
      return {
        success: false,
        error: error.message,
        details: {
          status: error.response?.status,
          shopifyErrors: error.response?.data?.errors
        }
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

  /**
   * Upload image to Shopify product
   * @param {number} productId - Shopify product ID
   * @param {string} imagePath - Local path to image file
   * @param {Object} imageData - Image metadata (alt_text, position, variant_ids)
   * @returns {Promise<Object>} Shopify image response
   */
  async uploadImageToProduct(productId, imagePath, imageData = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`🖼️ [IMAGE_UPLOAD] Starting upload for product ${productId}, image: ${imagePath}`);

      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      // Read and encode image file
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const fileExtension = path.extname(imagePath).toLowerCase();
      
      // Determine MIME type
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      const mimeType = mimeTypes[fileExtension] || 'image/jpeg';

      logger.info(`🖼️ [IMAGE_UPLOAD] Image encoded - Size: ${imageBuffer.length} bytes, Type: ${mimeType}`);

      // Prepare image data for Shopify
      const shopifyImageData = {
        image: {
          attachment: base64Image,
          filename: path.basename(imagePath),
          alt: imageData.alt_text || '',
          position: imageData.position || 1
        }
      };

      // Add variant IDs if specified
      if (imageData.variant_ids && Array.isArray(imageData.variant_ids) && imageData.variant_ids.length > 0) {
        shopifyImageData.image.variant_ids = imageData.variant_ids;
        logger.info(`🖼️ [IMAGE_UPLOAD] Linking image to variants: ${imageData.variant_ids.join(', ')}`);
      }

      logger.info(`🖼️ [IMAGE_UPLOAD] Uploading to Shopify product ${productId}...`);

      // Upload to Shopify
      const response = await this.client.post(`/products/${productId}/images.json`, shopifyImageData);

      logger.info(`✅ [IMAGE_UPLOAD] Successfully uploaded image to Shopify - Image ID: ${response.data.image.id}`);
      logger.info(`🖼️ [IMAGE_UPLOAD] Image URL: ${response.data.image.src}`);
      
      if (response.data.image.variant_ids && response.data.image.variant_ids.length > 0) {
        logger.info(`🔗 [IMAGE_UPLOAD] Image linked to variants: ${response.data.image.variant_ids.join(', ')}`);
      }

      return response.data;

    } catch (error) {
      logger.error(`❌ [IMAGE_UPLOAD] Error uploading image ${imagePath} to product ${productId}:`, error.message);
      
      if (error.response && error.response.data) {
        logger.error(`❌ [IMAGE_UPLOAD] Shopify error details:`, error.response.data);
      }
      
      throw this.createShopifyError('Failed to upload image to Shopify', error);
    }
  }

  /**
   * Upload multiple images to Shopify product
   * @param {number} productId - Shopify product ID
   * @param {Array} imagesData - Array of image objects with path and metadata
   * @returns {Promise<Array>} Array of Shopify image responses
   */
  async uploadMultipleImagesToProduct(productId, imagesData) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`🖼️ [MULTI_IMAGE_UPLOAD] Starting upload of ${imagesData.length} images to product ${productId}`);

      const uploadResults = [];
      const errors = [];

      for (let i = 0; i < imagesData.length; i++) {
        const imageInfo = imagesData[i];
        
        try {
          logger.info(`🖼️ [MULTI_IMAGE_UPLOAD] Uploading image ${i + 1}/${imagesData.length}: ${imageInfo.path}`);
          
          const result = await this.uploadImageToProduct(productId, imageInfo.path, {
            alt_text: imageInfo.alt_text,
            position: imageInfo.position || (i + 1),
            variant_ids: imageInfo.variant_ids
          });

          uploadResults.push({
            success: true,
            localPath: imageInfo.path,
            shopifyImage: result.image,
            variantIds: imageInfo.variant_ids
          });

          // Add small delay between uploads to avoid rate limiting
          if (i < imagesData.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (error) {
          logger.error(`❌ [MULTI_IMAGE_UPLOAD] Failed to upload image ${imageInfo.path}:`, error.message);
          
          errors.push({
            success: false,
            localPath: imageInfo.path,
            error: error.message,
            variantIds: imageInfo.variant_ids
          });

          uploadResults.push({
            success: false,
            localPath: imageInfo.path,
            error: error.message,
            variantIds: imageInfo.variant_ids
          });
        }
      }

      const successCount = uploadResults.filter(r => r.success).length;
      const errorCount = errors.length;

      logger.info(`📊 [MULTI_IMAGE_UPLOAD] Upload completed - Success: ${successCount}, Errors: ${errorCount}`);

      if (errors.length > 0) {
        logger.warn(`⚠️ [MULTI_IMAGE_UPLOAD] Some images failed to upload:`, errors);
      }

      return {
        results: uploadResults,
        summary: {
          total: imagesData.length,
          successful: successCount,
          failed: errorCount
        }
      };

    } catch (error) {
      logger.error(`❌ [MULTI_IMAGE_UPLOAD] Error in bulk image upload:`, error.message);
      throw this.createShopifyError('Failed to upload multiple images', error);
    }
  }

  /**
   * Get images for a Shopify product
   * @param {number} productId - Shopify product ID
   * @returns {Promise<Array>} Array of product images
   */
  async getProductImages(productId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`🖼️ [GET_IMAGES] Fetching images for product ${productId}`);

      const response = await this.client.get(`/products/${productId}/images.json`);

      logger.info(`🖼️ [GET_IMAGES] Found ${response.data.images.length} images for product ${productId}`);

      return response.data;

    } catch (error) {
      logger.error(`❌ [GET_IMAGES] Error fetching images for product ${productId}:`, error.message);
      throw this.createShopifyError('Failed to fetch product images', error);
    }
  }

  /**
   * Delete image from Shopify product
   * @param {number} productId - Shopify product ID
   * @param {number} imageId - Shopify image ID
   * @returns {Promise<void>}
   */
  async deleteProductImage(productId, imageId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Shopify API not configured');
      }

      logger.info(`🗑️ [DELETE_IMAGE] Deleting image ${imageId} from product ${productId}`);

      await this.client.delete(`/products/${productId}/images/${imageId}.json`);

      logger.info(`✅ [DELETE_IMAGE] Successfully deleted image ${imageId} from product ${productId}`);

    } catch (error) {
      logger.error(`❌ [DELETE_IMAGE] Error deleting image ${imageId} from product ${productId}:`, error.message);
      throw this.createShopifyError('Failed to delete product image', error);
    }
  }
}

module.exports = ShopifyApiClient;