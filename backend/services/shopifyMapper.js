const logger = require('../config/logger');

class ShopifyMapper {
  /**
   * Map internal product data to Shopify product format
   * @param {Object} product - Product with all relations loaded
   * @returns {Object} Shopify-formatted product data
   */
  static mapProductToShopify(product) {
    try {
      const shopifyProduct = {
        product: {
          title: product.title,
          body_html: product.description || '',
          vendor: product.vendor || '',
          product_type: product.product_type || '',
          tags: product.tags || '',
          handle: product.handle,
          status: this.mapProductStatus(product.status),
          variants: this.mapVariantsToShopify(product.variants || []),
          images: this.mapImagesToShopify(product.images || []),
          options: this.mapOptionsToShopify(product.options || []),
          metafields: this.mapAttributesToMetafields(product.attributes || [])
        }
      };

      // Add SEO fields if available
      if (product.seo_title || product.seo_description) {
        shopifyProduct.product.seo = {
          title: product.seo_title || product.title,
          description: product.seo_description || product.description
        };
      }

      logger.info(`Mapped product ${product.id} to Shopify format`);
      return shopifyProduct;

    } catch (error) {
      logger.error('Error mapping product to Shopify:', error);
      throw new Error(`Failed to map product ${product.id} to Shopify format: ${error.message}`);
    }
  }

  /**
   * Map internal product status to Shopify status
   * @param {string} status - Internal status
   * @returns {string} Shopify status
   */
  static mapProductStatus(status) {
    const statusMap = {
      'active': 'active',
      'draft': 'draft',
      'archived': 'archived'
    };
    return statusMap[status] || 'draft';
  }

  /**
   * Map variants to Shopify format
   * @param {Array} variants - Array of variant objects
   * @returns {Array} Shopify-formatted variants
   */
  static mapVariantsToShopify(variants) {
    if (!variants || variants.length === 0) {
      // Create default variant if none exist
      return [{
        price: "0.00",
        inventory_quantity: 0,
        inventory_management: "manual",
        fulfillment_service: "manual",
        inventory_policy: "deny"
      }];
    }

    return variants.map((variant, variantIndex) => {
      const shopifyVariant = {
        price: variant.price.toString(),
        compare_at_price: variant.compare_at_price ? variant.compare_at_price.toString() : null,
        sku: variant.sku || '',
        barcode: variant.barcode || '',
        inventory_quantity: variant.inventory_quantity || 0,
        inventory_management: this.mapInventoryManagement(variant.inventory_management),
        fulfillment_service: "manual",
        inventory_policy: "deny",
        requires_shipping: true,
        taxable: true
      };

      // Map option values to option1, option2, option3 (required by Shopify REST API)
      if (variant.selectedOptions && variant.selectedOptions.length > 0) {
        variant.selectedOptions.forEach((option, index) => {
          if (index < 3) { // Shopify supports max 3 options
            shopifyVariant[`option${index + 1}`] = option.value;
          }
        });
      } else {
        // If no selectedOptions, try to extract from variant data
        if (variant.option1) {
          shopifyVariant.option1 = variant.option1;
        } else {
          // Generate unique option value based on variant index to avoid duplicates
          shopifyVariant.option1 = `Variant ${variantIndex + 1}`;
        }
        
        if (variant.option2) shopifyVariant.option2 = variant.option2;
        if (variant.option3) shopifyVariant.option3 = variant.option3;
      }

      // Add weight if available
      if (variant.weight) {
        shopifyVariant.weight = variant.weight;
        shopifyVariant.weight_unit = variant.weight_unit || 'kg';
      }

      // Add Shopify ID if exists (for updates)
      if (variant.shopify_id) {
        shopifyVariant.id = variant.shopify_id;
      }

      return shopifyVariant;
    });
  }

  /**
   * Map inventory management to Shopify format
   * @param {string} management - Internal inventory management
   * @returns {string} Shopify inventory management
   */
  static mapInventoryManagement(management) {
    const managementMap = {
      'shopify': 'shopify',
      'manual': 'shopify', // Map manual to shopify for tracking
      'none': null
    };
    return managementMap[management] || 'shopify';
  }

  /**
   * Map images to Shopify format
   * @param {Array} images - Array of image objects
   * @returns {Array} Shopify-formatted images
   */
  static mapImagesToShopify(images) {
    if (!images || images.length === 0) {
      return [];
    }

    return images
      .sort((a, b) => a.position - b.position)
      .map(image => {
        const fullUrl = this.getFullImageUrl(image.src);
        
        // Skip localhost URLs as Shopify cannot access them
        if (this.isLocalhostUrl(fullUrl)) {
          logger.warn(`Skipping localhost image URL for Shopify export: ${fullUrl}`);
          return null;
        }

        const shopifyImage = {
          src: fullUrl,
          alt: image.alt_text || '',
          position: image.position || 1
        };

        // Add variant IDs if image is associated with specific variants
        if (image.variant_id) {
          shopifyImage.variant_ids = [image.variant_id];
        }

        return shopifyImage;
      })
      .filter(image => image !== null); // Remove null entries (localhost URLs)
  }

  /**
   * Map options to Shopify format
   * @param {Array} options - Array of option objects
   * @returns {Array} Shopify-formatted options
   */
  static mapOptionsToShopify(options) {
    if (!options || options.length === 0) {
      return [];
    }

    return options
      .sort((a, b) => a.position - b.position)
      .map(option => ({
        name: option.name,
        position: option.position,
        values: Array.isArray(option.values) ? option.values : []
      }));
  }

  /**
   * Map attributes to Shopify metafields
   * @param {Array} attributes - Array of attribute objects
   * @returns {Array} Shopify-formatted metafields
   */
  static mapAttributesToMetafields(attributes) {
    if (!attributes || attributes.length === 0) {
      return [];
    }

    return attributes.map(attribute => ({
      namespace: attribute.namespace || 'custom',
      key: attribute.key,
      value: attribute.value || '',
      type: this.getShopifyMetafieldType(attribute.value_type)
    }));
  }

  /**
   * Get Shopify metafield type from internal value type
   * @param {string} valueType - Internal value type
   * @returns {string} Shopify metafield type
   */
  static getShopifyMetafieldType(valueType) {
    const typeMap = {
      'string': 'single_line_text_field',
      'text': 'multi_line_text_field',
      'number': 'number_integer',
      'boolean': 'boolean',
      'date': 'date',
      'json': 'json'
    };
    return typeMap[valueType] || 'single_line_text_field';
  }

  /**
   * Get full image URL (convert relative to absolute if needed)
   * @param {string} src - Image source
   * @returns {string} Full image URL
   */
  static getFullImageUrl(src) {
    if (!src) return '';
    
    // If already absolute URL, return as is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // If relative URL, convert to absolute
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    return `${baseUrl}${src}`;
  }

  /**
   * Check if URL is a localhost URL (not accessible by Shopify)
   * @param {string} url - URL to check
   * @returns {boolean} True if localhost URL
   */
  static isLocalhostUrl(url) {
    if (!url) return false;
    return url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0');
  }

  /**
   * Map Shopify product response back to internal format (for updates)
   * @param {Object} shopifyProduct - Shopify product response
   * @returns {Object} Internal product update data
   */
  static mapShopifyResponseToInternal(shopifyProduct) {
    try {
      const updateData = {
        shopify_id: shopifyProduct.id,
        handle: shopifyProduct.handle,
        // Map other fields as needed
      };

      // Note: Variants are updated separately in the route handler
      // to avoid Sequelize primary key issues when updating the product

      logger.info(`Mapped Shopify response for product ${shopifyProduct.id} to internal format`);
      return updateData;

    } catch (error) {
      logger.error('Error mapping Shopify response to internal format:', error);
      throw new Error(`Failed to map Shopify response: ${error.message}`);
    }
  }

  /**
   * Validate product data before mapping to Shopify
   * @param {Object} product - Product to validate
   * @returns {Object} Validation result
   */
  static validateProductForShopify(product) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!product.title || product.title.trim() === '') {
      errors.push('Product title is required');
    }

    // Validate variants
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant, index) => {
        if (variant.price === null || variant.price === undefined) {
          errors.push(`Variant ${index + 1}: Price is required`);
        }
        if (variant.price < 0) {
          errors.push(`Variant ${index + 1}: Price cannot be negative`);
        }
      });
    }

    // Validate images
    if (product.images && product.images.length > 0) {
      product.images.forEach((image, index) => {
        if (!image.src) {
          warnings.push(`Image ${index + 1}: Missing source URL`);
        } else {
          const fullUrl = this.getFullImageUrl(image.src);
          if (this.isLocalhostUrl(fullUrl)) {
            warnings.push(`Image ${index + 1}: Localhost URLs cannot be accessed by Shopify and will be skipped`);
          }
        }
      });
    }

    // Check for recommended fields
    if (!product.description) {
      warnings.push('Product description is recommended');
    }
    if (!product.vendor) {
      warnings.push('Product vendor is recommended');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Map single variant to Shopify format (for individual variant export)
   * @param {Object} variant - Variant object with product relation
   * @returns {Object} Shopify-formatted variant data
   */
  static mapSingleVariantToShopify(variant) {
    try {
      const shopifyVariant = {
        price: variant.price.toString(),
        compare_at_price: variant.compare_at_price ? variant.compare_at_price.toString() : null,
        sku: variant.sku || '',
        barcode: variant.barcode || '',
        inventory_quantity: variant.inventory_quantity || 0,
        inventory_management: this.mapInventoryManagement(variant.inventory_management),
        fulfillment_service: "manual",
        inventory_policy: "deny",
        requires_shipping: true,
        taxable: true
      };

      // Add weight if available
      if (variant.weight) {
        shopifyVariant.weight = variant.weight;
        shopifyVariant.weight_unit = variant.weight_unit || 'kg';
      }

      // Add Shopify ID if exists (for updates)
      if (variant.shopify_id) {
        shopifyVariant.id = variant.shopify_id;
      }

      // Map option values to option1, option2, option3 (required by Shopify REST API)
      if (variant.selectedOptions && variant.selectedOptions.length > 0) {
        variant.selectedOptions.forEach((option, index) => {
          if (index < 3) { // Shopify supports max 3 options
            shopifyVariant[`option${index + 1}`] = option.value;
          }
        });
      } else {
        // If no selectedOptions, try to extract from variant data
        if (variant.option1) {
          shopifyVariant.option1 = variant.option1;
        } else {
          // Generate unique option value based on variant ID or SKU to avoid duplicates
          shopifyVariant.option1 = variant.sku || `Variant-${variant.id || Date.now()}`;
        }
        
        if (variant.option2) shopifyVariant.option2 = variant.option2;
        if (variant.option3) shopifyVariant.option3 = variant.option3;
      }

      logger.info(`Mapped variant ${variant.id} to Shopify format`);
      return shopifyVariant;

    } catch (error) {
      logger.error('Error mapping variant to Shopify:', error);
      throw new Error(`Failed to map variant ${variant.id} to Shopify format: ${error.message}`);
    }
  }

  /**
   * Validate single variant for Shopify export
   * @param {Object} variant - Variant to validate
   * @returns {Object} Validation result
   */
  static validateVariantForShopify(variant) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (variant.price === null || variant.price === undefined) {
      errors.push('Variant price is required');
    }
    if (variant.price < 0) {
      errors.push('Variant price cannot be negative');
    }

    // Check parent product
    if (!variant.product) {
      errors.push('Variant must have associated product data');
    } else if (!variant.product.shopify_id) {
      errors.push('Parent product must be exported to Shopify first');
    }

    // Recommended fields
    if (!variant.sku) {
      warnings.push('SKU is recommended for inventory tracking');
    }
    if (variant.inventory_quantity === 0) {
      warnings.push('Inventory quantity is 0 - product will appear as out of stock');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = ShopifyMapper;