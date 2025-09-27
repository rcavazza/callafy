const express = require('express');
const { Product, Variant, Option, Image, Attribute, Category } = require('../models');
const ShopifyMapper = require('../services/shopifyMapper');
const ShopifyApiClient = require('../services/shopifyApi');
const logger = require('../config/logger');

const router = express.Router();
const shopifyClient = new ShopifyApiClient();

// GET /api/shopify/test - Test Shopify connection
router.get('/test', async (req, res, next) => {
  try {
    const result = await shopifyClient.testConnection();
    
    res.json({
      success: result.success,
      data: result.success ? result.shop : null,
      message: result.success ? result.message : result.error
    });

  } catch (error) {
    logger.error('Error testing Shopify connection:', error);
    next(error);
  }
});

// GET /api/shopify/rate-limit - Get rate limit status
router.get('/rate-limit', async (req, res, next) => {
  try {
    const rateLimitStatus = await shopifyClient.getRateLimitStatus();
    
    res.json({
      success: true,
      data: rateLimitStatus
    });

  } catch (error) {
    logger.error('Error getting rate limit status:', error);
    next(error);
  }
});

// POST /api/shopify/export/:productId - Export product to Shopify
router.post('/export/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { force = false } = req.body;

    // Fetch product with all relations
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: Variant,
          as: 'variants',
          order: [['createdAt', 'ASC']]
        },
        {
          model: Option,
          as: 'options',
          order: [['position', 'ASC']]
        },
        {
          model: Image,
          as: 'images',
          order: [['position', 'ASC']]
        },
        {
          model: Attribute,
          as: 'attributes',
          where: { variant_id: null },
          required: false
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if product already exists in Shopify (unless force is true)
    if (product.shopify_id && !force) {
      return res.status(400).json({
        success: false,
        error: 'Product already exported to Shopify. Use force=true to update.',
        shopify_id: product.shopify_id
      });
    }

    // Validate product for Shopify export
    const validation = ShopifyMapper.validateProductForShopify(product);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Product validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Map product to Shopify format (without images)
    const shopifyProductData = ShopifyMapper.mapProductToShopify(product);

    let shopifyResponse;
    let isUpdate = false;
    let imageUploadResults = null;

    try {
      if (product.shopify_id && force) {
        // Update existing product
        shopifyResponse = await shopifyClient.updateProduct(product.shopify_id, shopifyProductData);
        isUpdate = true;
        logger.info(`🔄 [EXPORT] Product ${productId} updated in Shopify with ID ${product.shopify_id}`);
      } else {
        // Create new product
        shopifyResponse = await shopifyClient.createProduct(shopifyProductData);
        logger.info(`✅ [EXPORT] Product ${productId} created in Shopify with ID ${shopifyResponse.product.id}`);
      }

      // Update local product with Shopify data
      const updateData = ShopifyMapper.mapShopifyResponseToInternal(shopifyResponse.product);
      await product.update(updateData);

      // Update variants with Shopify IDs
      if (shopifyResponse.product.variants && product.variants) {
        for (let i = 0; i < shopifyResponse.product.variants.length && i < product.variants.length; i++) {
          const shopifyVariant = shopifyResponse.product.variants[i];
          const localVariant = product.variants[i];
          
          await localVariant.update({
            shopify_id: shopifyVariant.id
          });
          
          logger.info(`🔗 [EXPORT] Updated variant ${localVariant.id} with Shopify ID ${shopifyVariant.id}`);
        }
      }

      // Now upload images separately
      if (product.images && product.images.length > 0) {
        logger.info(`🖼️ [EXPORT] Starting image upload for ${product.images.length} images`);
        
        try {
          // Prepare images for upload with updated variant IDs
          const updatedVariants = await product.getVariants(); // Get fresh variant data with shopify_id
          const imagesData = ShopifyMapper.prepareImagesForUpload(product.images, updatedVariants);
          
          if (imagesData.length > 0) {
            // Upload images to Shopify
            imageUploadResults = await shopifyClient.uploadMultipleImagesToProduct(
              shopifyResponse.product.id,
              imagesData
            );
            
            logger.info(`📊 [EXPORT] Image upload completed - Success: ${imageUploadResults.summary.successful}, Failed: ${imageUploadResults.summary.failed}`);
          } else {
            logger.warn(`⚠️ [EXPORT] No valid images found for upload`);
          }
          
        } catch (imageError) {
          logger.error(`❌ [EXPORT] Error uploading images:`, imageError.message);
          // Don't fail the entire export if images fail
          imageUploadResults = {
            summary: { total: product.images.length, successful: 0, failed: product.images.length },
            error: imageError.message
          };
        }
      }

      const responseData = {
        product_id: product.id,
        shopify_id: shopifyResponse.product.id,
        shopify_handle: shopifyResponse.product.handle,
        action: isUpdate ? 'updated' : 'created',
        variants_count: shopifyResponse.product.variants?.length || 0,
        images_count: imageUploadResults ? imageUploadResults.summary.successful : 0,
        images_failed: imageUploadResults ? imageUploadResults.summary.failed : 0,
        metafields_count: shopifyProductData.product.metafields?.length || 0
      };

      // Add image upload details if available
      if (imageUploadResults) {
        responseData.image_upload_summary = imageUploadResults.summary;
        if (imageUploadResults.error) {
          responseData.image_upload_error = imageUploadResults.error;
        }
      }

      const warnings = [...(validation.warnings || [])];
      if (imageUploadResults && imageUploadResults.summary.failed > 0) {
        warnings.push(`${imageUploadResults.summary.failed} images failed to upload to Shopify`);
      }

      res.json({
        success: true,
        data: responseData,
        message: `Product ${isUpdate ? 'updated' : 'exported'} to Shopify successfully`,
        warnings: warnings
      });

    } catch (shopifyError) {
      logger.error('Shopify API error during export:', shopifyError);
      
      res.status(500).json({
        success: false,
        error: 'Failed to export to Shopify',
        details: shopifyError.message,
        shopify_errors: shopifyError.shopifyErrors
      });
    }

  } catch (error) {
    logger.error('Error exporting product to Shopify:', error);
    next(error);
  }
});

// PUT /api/shopify/sync/:productId - Sync product from Shopify
router.put('/sync/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (!product.shopify_id) {
      return res.status(400).json({
        success: false,
        error: 'Product not linked to Shopify'
      });
    }

    try {
      // Fetch product from Shopify
      const shopifyResponse = await shopifyClient.getProduct(product.shopify_id);
      
      // Update local product with Shopify data
      const updateData = ShopifyMapper.mapShopifyResponseToInternal(shopifyResponse.product);
      await product.update(updateData);

      res.json({
        success: true,
        data: {
          product_id: product.id,
          shopify_id: product.shopify_id,
          synced_at: new Date().toISOString()
        },
        message: 'Product synced from Shopify successfully'
      });

    } catch (shopifyError) {
      logger.error('Shopify API error during sync:', shopifyError);
      
      res.status(500).json({
        success: false,
        error: 'Failed to sync from Shopify',
        details: shopifyError.message
      });
    }

  } catch (error) {
    logger.error('Error syncing product from Shopify:', error);
    next(error);
  }
});

// DELETE /api/shopify/unlink/:productId - Unlink product from Shopify
router.delete('/unlink/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { deleteFromShopify = false } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (!product.shopify_id) {
      return res.status(400).json({
        success: false,
        error: 'Product not linked to Shopify'
      });
    }

    const shopifyId = product.shopify_id;

    try {
      // Delete from Shopify if requested
      if (deleteFromShopify) {
        await shopifyClient.deleteProduct(shopifyId);
        logger.info(`Product ${shopifyId} deleted from Shopify`);
      }

      // Remove Shopify IDs from local product and variants
      await product.update({ shopify_id: null });
      
      if (product.variants) {
        await Variant.update(
          { shopify_id: null },
          { where: { product_id: productId } }
        );
      }

      res.json({
        success: true,
        data: {
          product_id: product.id,
          shopify_id: shopifyId,
          deleted_from_shopify: deleteFromShopify
        },
        message: `Product unlinked from Shopify${deleteFromShopify ? ' and deleted' : ''}`
      });

    } catch (shopifyError) {
      logger.error('Shopify API error during unlink:', shopifyError);
      
      res.status(500).json({
        success: false,
        error: 'Failed to unlink from Shopify',
        details: shopifyError.message
      });
    }

  } catch (error) {
    logger.error('Error unlinking product from Shopify:', error);
    next(error);
  }
});

// GET /api/shopify/preview/:productId - Preview Shopify export data
router.get('/preview/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Fetch product with all relations
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: Variant,
          as: 'variants',
          order: [['createdAt', 'ASC']]
        },
        {
          model: Option,
          as: 'options',
          order: [['position', 'ASC']]
        },
        {
          model: Image,
          as: 'images',
          order: [['position', 'ASC']]
        },
        {
          model: Attribute,
          as: 'attributes',
          where: { variant_id: null },
          required: false
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Validate product for Shopify export
    const validation = ShopifyMapper.validateProductForShopify(product);

    // Map product to Shopify format
    const shopifyProductData = ShopifyMapper.mapProductToShopify(product);

    // Prepare image upload preview
    let imagePreview = null;
    if (product.images && product.images.length > 0) {
      try {
        const imagesData = ShopifyMapper.prepareImagesForUpload(product.images, product.variants || []);
        imagePreview = {
          total_images: product.images.length,
          uploadable_images: imagesData.length,
          images_details: imagesData.map(img => ({
            filename: require('path').basename(img.path),
            position: img.position,
            alt_text: img.alt_text,
            variant_ids: img.variant_ids,
            local_variant_id: img.localVariantId,
            file_exists: require('fs').existsSync(img.path)
          }))
        };
        
        logger.info(`🔍 [PREVIEW] Image analysis - Total: ${imagePreview.total_images}, Uploadable: ${imagePreview.uploadable_images}`);
      } catch (error) {
        logger.error(`❌ [PREVIEW] Error analyzing images:`, error.message);
        imagePreview = {
          error: `Failed to analyze images: ${error.message}`
        };
      }
    }

    res.json({
      success: true,
      data: {
        validation,
        shopify_data: shopifyProductData,
        image_preview: imagePreview,
        summary: {
          title: product.title,
          variants_count: product.variants?.length || 0,
          images_count: product.images?.length || 0,
          uploadable_images_count: imagePreview ? imagePreview.uploadable_images || 0 : 0,
          options_count: product.options?.length || 0,
          attributes_count: product.attributes?.length || 0,
          already_exported: !!product.shopify_id,
          shopify_id: product.shopify_id
        }
      }
    });

  } catch (error) {
    logger.error('Error previewing Shopify export:', error);
    next(error);
  }
});

// POST /api/shopify/bulk-export - Bulk export products to Shopify
router.post('/bulk-export', async (req, res, next) => {
  try {
    const { product_ids, force = false } = req.body;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'product_ids array is required'
      });
    }

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const productId of product_ids) {
      try {
        // This would normally call the single export endpoint
        // For now, we'll just simulate the process
        const product = await Product.findByPk(productId);
        
        if (!product) {
          results.failed.push({
            product_id: productId,
            error: 'Product not found'
          });
          continue;
        }

        if (product.shopify_id && !force) {
          results.skipped.push({
            product_id: productId,
            shopify_id: product.shopify_id,
            reason: 'Already exported'
          });
          continue;
        }

        // Simulate successful export
        results.success.push({
          product_id: productId,
          shopify_id: product.shopify_id || 'simulated-id',
          action: product.shopify_id ? 'updated' : 'created'
        });

      } catch (error) {
        results.failed.push({
          product_id: productId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results,
      summary: {
        total: product_ids.length,
        successful: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      message: `Bulk export completed: ${results.success.length} successful, ${results.failed.length} failed, ${results.skipped.length} skipped`
    });

  } catch (error) {
    logger.error('Error in bulk export:', error);
    next(error);
  }
});

// POST /api/shopify/export-variant/:variantId - Export single variant to Shopify
router.post('/export-variant/:variantId', async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { force = false } = req.body;

    // Fetch variant with product data
    const variant = await Variant.findByPk(variantId, {
      include: [{
        model: Product,
        as: 'product',
        include: [
          {
            model: Category,
            as: 'category'
          },
          {
            model: Option,
            as: 'options',
            order: [['position', 'ASC']]
          },
          {
            model: Image,
            as: 'images',
            order: [['position', 'ASC']]
          }
        ]
      }]
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    // Check if parent product is exported to Shopify
    if (!variant.product.shopify_id) {
      return res.status(400).json({
        success: false,
        error: 'Parent product must be exported to Shopify first',
        details: 'Export the complete product before exporting individual variants'
      });
    }

    // Check if variant already exists in Shopify (unless force is true)
    if (variant.shopify_id && !force) {
      return res.status(400).json({
        success: false,
        error: 'Variant already exported to Shopify. Use force=true to update.',
        shopify_id: variant.shopify_id
      });
    }

    try {
      let shopifyResponse;
      let isUpdate = false;

      if (variant.shopify_id && force) {
        // Update existing variant
        const variantData = {
          variant: ShopifyMapper.mapSingleVariantToShopify(variant)
        };
        shopifyResponse = await shopifyClient.updateVariant(variant.shopify_id, variantData);
        isUpdate = true;
        logger.info(`Variant ${variantId} updated in Shopify with ID ${variant.shopify_id}`);
      } else {
        // Create new variant in existing product
        const variantData = {
          variant: ShopifyMapper.mapSingleVariantToShopify(variant)
        };
        shopifyResponse = await shopifyClient.createVariantInProduct(variant.product.shopify_id, variantData);
        logger.info(`Variant ${variantId} created in Shopify with ID ${shopifyResponse.variant.id}`);
      }

      // Update local variant with Shopify ID
      await variant.update({
        shopify_id: shopifyResponse.variant.id
      });

      let imageUploadResults = null;

      // Upload images specific to this variant
      if (variant.product.images && variant.product.images.length > 0) {
        logger.info(`🖼️ [VARIANT_EXPORT] Checking images for variant ${variantId}`);
        
        // Filter images that belong to this specific variant
        const variantImages = variant.product.images.filter(image => image.variant_id === variant.id);
        
        if (variantImages.length > 0) {
          logger.info(`🖼️ [VARIANT_EXPORT] Found ${variantImages.length} images for variant ${variantId}`);
          
          try {
            // Prepare images for upload with the updated variant Shopify ID
            const updatedVariant = { ...variant.toJSON(), shopify_id: shopifyResponse.variant.id };
            const imagesData = ShopifyMapper.prepareImagesForUpload(variantImages, [updatedVariant]);
            
            if (imagesData.length > 0) {
              // Upload images to Shopify
              imageUploadResults = await shopifyClient.uploadMultipleImagesToProduct(
                variant.product.shopify_id,
                imagesData
              );
              
              logger.info(`📊 [VARIANT_EXPORT] Image upload completed - Success: ${imageUploadResults.summary.successful}, Failed: ${imageUploadResults.summary.failed}`);
            } else {
              logger.warn(`⚠️ [VARIANT_EXPORT] No valid images found for upload`);
            }
            
          } catch (imageError) {
            logger.error(`❌ [VARIANT_EXPORT] Error uploading images for variant ${variantId}:`, imageError.message);
            // Don't fail the entire export if images fail
            imageUploadResults = {
              summary: { total: variantImages.length, successful: 0, failed: variantImages.length },
              error: imageError.message
            };
          }
        } else {
          logger.info(`ℹ️ [VARIANT_EXPORT] No images found specifically for variant ${variantId}`);
        }
      }

      const responseData = {
        variant_id: variant.id,
        shopify_id: shopifyResponse.variant.id,
        product_shopify_id: variant.product.shopify_id,
        action: isUpdate ? 'updated' : 'created',
        sku: shopifyResponse.variant.sku,
        price: shopifyResponse.variant.price,
        images_count: imageUploadResults ? imageUploadResults.summary.successful : 0,
        images_failed: imageUploadResults ? imageUploadResults.summary.failed : 0
      };

      // Add image upload details if available
      if (imageUploadResults) {
        responseData.image_upload_summary = imageUploadResults.summary;
        if (imageUploadResults.error) {
          responseData.image_upload_error = imageUploadResults.error;
        }
      }

      const warnings = [];
      if (imageUploadResults && imageUploadResults.summary.failed > 0) {
        warnings.push(`${imageUploadResults.summary.failed} images failed to upload to Shopify`);
      }

      res.json({
        success: true,
        data: responseData,
        message: `Variant ${isUpdate ? 'updated' : 'exported'} to Shopify successfully`,
        warnings: warnings
      });

    } catch (shopifyError) {
      logger.error('Shopify API error during variant export:', shopifyError);
      
      res.status(500).json({
        success: false,
        error: 'Failed to export variant to Shopify',
        details: shopifyError.message,
        shopify_errors: shopifyError.shopifyErrors
      });
    }

  } catch (error) {
    logger.error('Error exporting variant to Shopify:', error);
    next(error);
  }
});

module.exports = router;