const express = require('express');
const { Attribute, Product, Variant } = require('../models');
const Joi = require('joi');
const logger = require('../config/logger');

const router = express.Router();

// Validation schema
const attributeSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  variant_id: Joi.number().integer().allow(null),
  category: Joi.string().max(255).default('custom'),
  key: Joi.string().min(1).max(255).required(),
  value: Joi.string().allow('', null),
  value_type: Joi.string().valid('string', 'number', 'boolean', 'date', 'json').default('string'),
  namespace: Joi.string().max(255).default('custom')
});

// GET /api/attributes - List attributes with filters
router.get('/', async (req, res, next) => {
  try {
    const { product_id, variant_id, namespace, category } = req.query;

    const whereClause = {};
    if (product_id) whereClause.product_id = product_id;
    if (variant_id) whereClause.variant_id = variant_id;
    if (namespace) whereClause.namespace = namespace;
    if (category) whereClause.category = category;

    const attributes = await Attribute.findAll({
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
      order: [['namespace', 'ASC'], ['key', 'ASC']]
    });

    res.json({
      success: true,
      data: attributes
    });

  } catch (error) {
    logger.error('Error fetching attributes:', error);
    next(error);
  }
});

// GET /api/attributes/:id - Get single attribute
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const attribute = await Attribute.findByPk(id, {
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

    if (!attribute) {
      return res.status(404).json({
        success: false,
        error: 'Attribute not found'
      });
    }

    res.json({
      success: true,
      data: attribute
    });

  } catch (error) {
    logger.error('Error fetching attribute:', error);
    next(error);
  }
});

// POST /api/attributes - Create new attribute
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = attributeSchema.validate(req.body);
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

    // Check if variant exists (if provided)
    if (value.variant_id) {
      const variant = await Variant.findOne({
        where: { id: value.variant_id, product_id: value.product_id }
      });
      if (!variant) {
        return res.status(400).json({
          success: false,
          error: 'Variant not found or does not belong to the specified product'
        });
      }
    }

    const attribute = await Attribute.create(value);

    // Fetch created attribute with relations
    const createdAttribute = await Attribute.findByPk(attribute.id, {
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
      data: createdAttribute,
      message: 'Attribute created successfully'
    });

  } catch (error) {
    logger.error('Error creating attribute:', error);
    next(error);
  }
});

// PUT /api/attributes/:id - Update attribute
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = attributeSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const attribute = await Attribute.findByPk(id);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        error: 'Attribute not found'
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

    // Check if variant exists (if provided)
    if (value.variant_id) {
      const variant = await Variant.findOne({
        where: { id: value.variant_id, product_id: value.product_id }
      });
      if (!variant) {
        return res.status(400).json({
          success: false,
          error: 'Variant not found or does not belong to the specified product'
        });
      }
    }

    await attribute.update(value);

    // Fetch updated attribute with relations
    const updatedAttribute = await Attribute.findByPk(id, {
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
      data: updatedAttribute,
      message: 'Attribute updated successfully'
    });

  } catch (error) {
    logger.error('Error updating attribute:', error);
    next(error);
  }
});

// DELETE /api/attributes/:id - Delete attribute
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const attribute = await Attribute.findByPk(id);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        error: 'Attribute not found'
      });
    }

    await attribute.destroy();

    res.json({
      success: true,
      message: 'Attribute deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting attribute:', error);
    next(error);
  }
});

// GET /api/attributes/product/:productId - Get all attributes for a product
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const attributes = await Attribute.findAll({
      where: { product_id: productId },
      include: [
        {
          model: Variant,
          as: 'variant',
          attributes: ['id', 'sku'],
          required: false
        }
      ],
      order: [['namespace', 'ASC'], ['key', 'ASC']]
    });

    // Group attributes by variant_id
    const groupedAttributes = {
      product: attributes.filter(attr => attr.variant_id === null),
      variants: {}
    };

    attributes.filter(attr => attr.variant_id !== null).forEach(attr => {
      if (!groupedAttributes.variants[attr.variant_id]) {
        groupedAttributes.variants[attr.variant_id] = [];
      }
      groupedAttributes.variants[attr.variant_id].push(attr);
    });

    res.json({
      success: true,
      data: groupedAttributes
    });

  } catch (error) {
    logger.error('Error fetching product attributes:', error);
    next(error);
  }
});

module.exports = router;