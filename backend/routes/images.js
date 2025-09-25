const express = require('express');
const { Image, Product, Variant } = require('../models');
const Joi = require('joi');
const logger = require('../config/logger');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');

const router = express.Router();

// Validation schema
const imageSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  variant_id: Joi.number().integer().required(),
  src: Joi.string().uri().required(),
  alt_text: Joi.string().max(255).allow('', null),
  position: Joi.number().integer().min(1).default(1),
  width: Joi.number().integer().allow(null),
  height: Joi.number().integer().allow(null),
  size: Joi.number().integer().allow(null),
  filename: Joi.string().max(255).allow('', null)
});

// GET /api/images - List images with filters
router.get('/', async (req, res, next) => {
  try {
    const { product_id, variant_id } = req.query;

    const whereClause = {};
    if (product_id) whereClause.product_id = product_id;
    if (variant_id) whereClause.variant_id = variant_id;

    const images = await Image.findAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title']
        },
        {
          model: Variant,
          as: 'variant',
          attributes: ['id', 'sku'],
          required: false
        }
      ],
      order: [['position', 'ASC']]
    });

    res.json({
      success: true,
      data: images
    });

  } catch (error) {
    logger.error('Error fetching images:', error);
    next(error);
  }
});

// GET /api/images/:id - Get single image
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const image = await Image.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title']
        },
        {
          model: Variant,
          as: 'variant',
          attributes: ['id', 'sku'],
          required: false
        }
      ]
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    res.json({
      success: true,
      data: image
    });

  } catch (error) {
    logger.error('Error fetching image:', error);
    next(error);
  }
});

// POST /api/images - Create new image
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = imageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if product exists
    const product = await Product.findByPk(value.product_id);
    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if variant exists and belongs to the product
    const variant = await Variant.findOne({
      where: { id: value.variant_id, product_id: value.product_id }
    });
    if (!variant) {
      return res.status(400).json({
        success: false,
        error: 'Variant not found or does not belong to the specified product'
      });
    }

    const image = await Image.create(value);

    // Fetch created image with relations
    const createdImage = await Image.findByPk(image.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title']
        },
        {
          model: Variant,
          as: 'variant',
          attributes: ['id', 'sku'],
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdImage,
      message: 'Image created successfully'
    });

  } catch (error) {
    logger.error('Error creating image:', error);
    next(error);
  }
});

// PUT /api/images/:id - Update image
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = imageSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const image = await Image.findByPk(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    await image.update(value);

    // Fetch updated image with relations
    const updatedImage = await Image.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title']
        },
        {
          model: Variant,
          as: 'variant',
          attributes: ['id', 'sku'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: updatedImage,
      message: 'Image updated successfully'
    });

  } catch (error) {
    logger.error('Error updating image:', error);
    next(error);
  }
});

// DELETE /api/images/:id - Delete image
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const image = await Image.findByPk(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    await image.destroy();

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting image:', error);
    next(error);
  }
});

// PUT /api/images/:id/position - Update image position
router.put('/:id/position', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    if (!position || position < 1) {
      return res.status(400).json({
        success: false,
        error: 'Position must be a positive integer'
      });
    }

    const image = await Image.findByPk(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    await image.update({ position });

    res.json({
      success: true,
      data: image,
      message: 'Image position updated successfully'
    });

  } catch (error) {
    logger.error('Error updating image position:', error);
    next(error);
  }
});

// POST /api/images/upload - Upload single image
router.post('/upload', uploadSingle('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Extract metadata from request body
    const { product_id, variant_id, alt_text, position } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'product_id is required'
      });
    }

    // Check if product exists
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if variant exists and belongs to the product
    if (!variant_id) {
      return res.status(400).json({
        success: false,
        error: 'variant_id is required'
      });
    }
    
    const variant = await Variant.findOne({
      where: { id: variant_id, product_id: product_id }
    });
    if (!variant) {
      return res.status(400).json({
        success: false,
        error: 'Variant not found or does not belong to the specified product'
      });
    }

    // Create image record
    const imageData = {
      product_id: parseInt(product_id),
      variant_id: parseInt(variant_id),
      src: `/uploads/${req.file.filename}`,
      alt_text: alt_text || '',
      position: position ? parseInt(position) : 1,
      width: null, // Could be extracted from file if needed
      height: null, // Could be extracted from file if needed
      size: req.file.size,
      filename: req.file.originalname
    };

    const image = await Image.create(imageData);

    // Fetch created image with relations
    const createdImage = await Image.findByPk(image.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title']
        },
        {
          model: Variant,
          as: 'variant',
          attributes: ['id', 'sku'],
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdImage,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      },
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    logger.error('Error uploading image:', error);
    next(error);
  }
});

// POST /api/images/upload-multiple - Upload multiple images
router.post('/upload-multiple', uploadMultiple('images', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    // Extract metadata from request body
    const { product_id, variant_id, alt_text } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'product_id is required'
      });
    }

    // Check if product exists
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if variant exists and belongs to the product
    if (!variant_id) {
      return res.status(400).json({
        success: false,
        error: 'variant_id is required'
      });
    }
    
    const variant = await Variant.findOne({
      where: { id: variant_id, product_id: product_id }
    });
    if (!variant) {
      return res.status(400).json({
        success: false,
        error: 'Variant not found or does not belong to the specified product'
      });
    }

    // Create image records for all uploaded files
    const createdImages = [];
    const uploadedFiles = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      const imageData = {
        product_id: parseInt(product_id),
        variant_id: parseInt(variant_id),
        src: `/uploads/${file.filename}`,
        alt_text: alt_text || '',
        position: i + 1,
        width: null,
        height: null,
        size: file.size,
        filename: file.originalname
      };

      const image = await Image.create(imageData);
      
      // Fetch created image with relations
      const createdImage = await Image.findByPk(image.id, {
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'title']
          },
          {
            model: Variant,
            as: 'variant',
            attributes: ['id', 'sku'],
            required: false
          }
        ]
      });

      createdImages.push(createdImage);
      uploadedFiles.push({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        url: `/uploads/${file.filename}`
      });
    }

    res.status(201).json({
      success: true,
      data: createdImages,
      files: uploadedFiles,
      count: createdImages.length,
      message: `${createdImages.length} images uploaded successfully`
    });

  } catch (error) {
    logger.error('Error uploading multiple images:', error);
    next(error);
  }
});

// GET /api/variants/:variantId/images - Get images for a specific variant
router.get('/variants/:variantId/images', async (req, res, next) => {
  try {
    const { variantId } = req.params;

    // Check if variant exists
    const variant = await Variant.findByPk(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    const images = await Image.findAll({
      where: { variant_id: variantId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title']
        },
        {
          model: Variant,
          as: 'variant',
          attributes: ['id', 'sku']
        }
      ],
      order: [['position', 'ASC']]
    });

    res.json({
      success: true,
      data: images
    });

  } catch (error) {
    logger.error('Error fetching variant images:', error);
    next(error);
  }
});

// POST /api/variants/:variantId/images/upload - Upload images for a specific variant
router.post('/variants/:variantId/images/upload', uploadMultiple('images', 10), async (req, res, next) => {
  try {
    const { variantId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    // Check if variant exists
    const variant = await Variant.findByPk(variantId, {
      include: [{ model: Product, as: 'product' }]
    });
    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    const { alt_text } = req.body;
    const createdImages = [];
    const uploadedFiles = [];

    // Create image records for all uploaded files
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      const imageData = {
        product_id: variant.product_id,
        variant_id: parseInt(variantId),
        src: `/uploads/${file.filename}`,
        alt_text: alt_text || '',
        position: i + 1,
        width: null,
        height: null,
        size: file.size,
        filename: file.originalname
      };

      const image = await Image.create(imageData);
      
      // Fetch created image with relations
      const createdImage = await Image.findByPk(image.id, {
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'title']
          },
          {
            model: Variant,
            as: 'variant',
            attributes: ['id', 'sku']
          }
        ]
      });

      createdImages.push(createdImage);
      uploadedFiles.push({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        url: `/uploads/${file.filename}`
      });
    }

    res.status(201).json({
      success: true,
      data: createdImages,
      files: uploadedFiles,
      count: createdImages.length,
      message: `${createdImages.length} images uploaded successfully for variant`
    });

  } catch (error) {
    logger.error('Error uploading variant images:', error);
    next(error);
  }
});

// DELETE /api/variants/:variantId/images/:imageId - Delete specific image from variant
router.delete('/variants/:variantId/images/:imageId', async (req, res, next) => {
  try {
    const { variantId, imageId } = req.params;

    const image = await Image.findOne({
      where: {
        id: imageId,
        variant_id: variantId
      }
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found for this variant'
      });
    }

    await image.destroy();

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting variant image:', error);
    next(error);
  }
});

// PUT /api/variants/:variantId/images/:imageId/position - Update image position within variant
router.put('/variants/:variantId/images/:imageId/position', async (req, res, next) => {
  try {
    const { variantId, imageId } = req.params;
    const { position } = req.body;

    if (!position || position < 1) {
      return res.status(400).json({
        success: false,
        error: 'Position must be a positive integer'
      });
    }

    const image = await Image.findOne({
      where: {
        id: imageId,
        variant_id: variantId
      }
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found for this variant'
      });
    }

    await image.update({ position });

    res.json({
      success: true,
      data: image,
      message: 'Image position updated successfully'
    });

  } catch (error) {
    logger.error('Error updating variant image position:', error);
    next(error);
  }
});

module.exports = router;