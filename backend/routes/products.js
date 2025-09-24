const express = require('express');
const { Op } = require('sequelize');
const { Product, Variant, VariantOption, Option, Image, Attribute, Category, CategoryField, sequelize } = require('../models');
const Joi = require('joi');
const logger = require('../config/logger');

const router = express.Router();

// Validation schemas
const productSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('', null),
  vendor: Joi.string().max(255).allow('', null),
  product_type: Joi.string().max(255).allow('', null),
  tags: Joi.string().allow('', null),
  handle: Joi.string().max(255).allow('', null),
  status: Joi.string().valid('active', 'archived', 'draft').default('draft'),
  category_id: Joi.number().integer().allow(null)
});

const variantSchema = Joi.object({
  id: Joi.number().integer().optional(), // For updates
  title: Joi.string().max(255).allow('', null),
  sku: Joi.string().max(255).allow('', null),
  price: Joi.number().min(0).required(),
  compare_at_price: Joi.number().min(0).allow(null),
  barcode: Joi.string().max(255).allow('', null),
  inventory_quantity: Joi.number().integer().min(0).default(0),
  inventory_management: Joi.string().valid('shopify', 'manual', 'none').default('manual'),
  weight: Joi.number().min(0).allow(null),
  weight_unit: Joi.string().valid('g', 'kg', 'oz', 'lb').default('kg'),
  selectedOptions: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      value: Joi.string().required()
    })
  ).optional()
});

const optionSchema = Joi.object({
  id: Joi.number().integer().optional(), // For updates
  name: Joi.string().min(1).max(255).required(),
  position: Joi.number().integer().min(1).default(1),
  values: Joi.array().items(Joi.string().min(1).max(255)).min(1).required()
});

// Extended schema for product creation with nested data
const productCreateSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('', null),
  vendor: Joi.string().max(255).allow('', null),
  product_type: Joi.string().max(255).allow('', null),
  tags: Joi.string().allow('', null),
  handle: Joi.string().max(255).allow('', null),
  status: Joi.string().valid('active', 'archived', 'draft').default('draft'),
  category_id: Joi.number().integer().allow(null),
  variants: Joi.array().items(variantSchema).min(1).optional(),
  options: Joi.array().items(optionSchema).optional(),
  category_fields: Joi.object().pattern(Joi.string(), Joi.alternatives().try(
    Joi.string().allow(''),
    Joi.number(),
    Joi.boolean()
  )).optional()
});

// GET /api/products - List all products with relations
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, category_id, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (category_id) whereClause.category_id = category_id;
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { vendor: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Variant,
          as: 'variants',
          attributes: ['id'], // Only load id for counting
          separate: true // This will make a separate query for variants
        },
        {
          model: Image,
          as: 'images',
          limit: 3 // Limit images in list view
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['updatedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching products:', error);
    next(error);
  }
});

// GET /api/products/:id - Get single product with all relations
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: Variant,
          as: 'variants',
          include: [
            {
              model: VariantOption,
              as: 'variantOptions',
              include: [
                {
                  model: Option,
                  as: 'option'
                }
              ]
            }
          ],
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

    // Format variants with their options for frontend compatibility
    const formattedProduct = {
      ...product.toJSON(),
      variants: product.variants.map(variant => ({
        ...variant.toJSON(),
        selectedOptions: variant.variantOptions.map(vo => ({
          name: vo.option.name,
          value: vo.option_value,
          position: vo.position
        }))
      }))
    };

    res.json({
      success: true,
      data: formattedProduct
    });

  } catch (error) {
    logger.error('Error fetching product:', error);
    next(error);
  }
});

// POST /api/products - Create new product with variants, options, and category fields
router.post('/', async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { error, value } = productCreateSchema.validate(req.body);
    if (error) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Extract nested data
    const { variants, options, category_fields, ...productData } = value;

    // Check if category exists
    if (productData.category_id) {
      const category = await Category.findByPk(productData.category_id);
      if (!category) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Category not found'
        });
      }
    }

    // Create the product
    const product = await Product.create(productData, { transaction });

    // Create variants if provided
    if (variants && variants.length > 0) {
      const variantsToCreate = variants.map(variant => ({
        ...variant,
        product_id: product.id
      }));
      await Variant.bulkCreate(variantsToCreate, { transaction });
    }

    // Create options if provided
    if (options && options.length > 0) {
      for (const option of options) {
        await Option.create({
          ...option,
          product_id: product.id,
          values: option.values // Store values as JSON array directly
        }, { transaction });
      }
    }

    // Create category field values if provided
    if (category_fields && Object.keys(category_fields).length > 0) {
      for (const [fieldId, value] of Object.entries(category_fields)) {
        if (value !== '' && value !== null && value !== undefined) {
          await Attribute.create({
            product_id: product.id,
            variant_id: null,
            key: `category_field_${fieldId}`,
            value: String(value),
            namespace: 'category_fields',
            category: 'category_field'
          }, { transaction });
        }
      }
    }

    await transaction.commit();

    // Fetch the created product with all relations
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: Variant,
          as: 'variants'
        },
        {
          model: Option,
          as: 'options'
        },
        {
          model: Attribute,
          as: 'attributes'
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdProduct,
      message: 'Product created successfully with all related data'
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating product:', error);
    next(error);
  }
});

// PUT /api/products/:id - Update product with variants, options, and category fields
router.put('/:id', async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { error, value } = productCreateSchema.validate(req.body);
    
    if (error) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Extract nested data
    const { variants, options, category_fields, defaultVariant, ...productData } = value;

    // Check if category exists
    if (productData.category_id) {
      const category = await Category.findByPk(productData.category_id);
      if (!category) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Category not found'
        });
      }
    }

    // Update basic product data
    await product.update(productData, { transaction });

    // Handle default variant update (for simplified form)
    if (defaultVariant) {
      const existingVariants = await Variant.findAll({
        where: { product_id: id },
        transaction
      });

      if (existingVariants.length > 0) {
        // Update the first variant
        await existingVariants[0].update(defaultVariant, { transaction });
      } else {
        // Create new default variant
        await Variant.create({
          ...defaultVariant,
          product_id: id
        }, { transaction });
      }
    }

    // Handle variants update (for complex form - backward compatibility)
    if (variants && variants.length > 0) {
      // Remove existing variants
      await Variant.destroy({
        where: { product_id: id },
        transaction
      });

      // Create new variants
      for (const variantData of variants) {
        await Variant.create({
          ...variantData,
          product_id: id
        }, { transaction });
      }
    }

    // Handle options update
    if (options && options.length > 0) {
      // Remove existing options
      await Option.destroy({
        where: { product_id: id },
        transaction
      });

      // Create new options
      for (let i = 0; i < options.length; i++) {
        const optionData = options[i];
        await Option.create({
          ...optionData,
          product_id: id,
          position: i + 1
        }, { transaction });
      }
    }

    // Handle category fields (stored as attributes)
    if (category_fields && Object.keys(category_fields).length > 0) {
      // Remove existing category field attributes
      await Attribute.destroy({
        where: {
          product_id: id,
          variant_id: null,
          namespace: 'category_field'
        },
        transaction
      });

      // Create new category field attributes
      for (const [fieldKey, fieldValue] of Object.entries(category_fields)) {
        if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
          await Attribute.create({
            product_id: id,
            variant_id: null,
            namespace: 'category_field',
            key: fieldKey,
            value: typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue)
          }, { transaction });
        }
      }
    }

    await transaction.commit();

    // Fetch updated product with all relations
    const updatedProduct = await Product.findByPk(id, {
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

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating product:', error);
    next(error);
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting product:', error);
    next(error);
  }
});

// POST /api/products/:id/variants - Add variant to product
// DEPRECATED: This endpoint has been replaced by the new dual-mode variants system
// in /routes/variants.js which supports Options-Variants relationships
/*
router.post('/:id/variants', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = variantSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const variant = await Variant.create({
      ...value,
      product_id: id
    });

    res.status(201).json({
      success: true,
      data: variant,
      message: 'Variant created successfully'
    });

  } catch (error) {
    logger.error('Error creating variant:', error);
    next(error);
  }
});
*/

// PUT /api/products/:productId/variants/:variantId - Update variant
router.put('/:productId/variants/:variantId', async (req, res, next) => {
  try {
    const { productId, variantId } = req.params;
    const { error, value } = variantSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const variant = await Variant.findOne({
      where: { id: variantId, product_id: productId }
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    await variant.update(value);

    res.json({
      success: true,
      data: variant,
      message: 'Variant updated successfully'
    });

  } catch (error) {
    logger.error('Error updating variant:', error);
    next(error);
  }
});

// DELETE /api/products/:productId/variants/:variantId - Delete variant
router.delete('/:productId/variants/:variantId', async (req, res, next) => {
  try {
    const { productId, variantId } = req.params;

    const variant = await Variant.findOne({
      where: { id: variantId, product_id: productId }
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    await variant.destroy();

    res.json({
      success: true,
      message: 'Variant deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting variant:', error);
    next(error);
  }
});

module.exports = router;