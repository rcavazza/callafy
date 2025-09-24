const express = require('express');
const { Op } = require('sequelize');
const { Category, CategoryField } = require('../models');
const Joi = require('joi');
const logger = require('../config/logger');

const router = express.Router();

// Validation schemas
const categorySchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('', null),
  shopify_product_type: Joi.string().max(255).allow('', null),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const categoryFieldSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  field_type: Joi.string().valid('string', 'number', 'boolean', 'date', 'text', 'select').default('string'),
  required: Joi.boolean().default(false),
  position: Joi.number().integer().min(0).default(0),
  options: Joi.array().items(Joi.string()).when('field_type', {
    is: 'select',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  default_value: Joi.string().allow('', null)
});

// GET /api/categories - List all categories with their fields
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: categories } = await Category.findAndCountAll({
      where: whereClause,
      include: [{
        model: CategoryField,
        as: 'fields',
        order: [['position', 'ASC']]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching categories:', error);
    next(error);
  }
});

// GET /api/categories/:id - Get single category with fields
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [{
        model: CategoryField,
        as: 'fields',
        order: [['position', 'ASC']]
      }]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    logger.error('Error fetching category:', error);
    next(error);
  }
});

// POST /api/categories - Create new category
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const category = await Category.create(value);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });

  } catch (error) {
    logger.error('Error creating category:', error);
    next(error);
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = categorySchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    await category.update(value);

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });

  } catch (error) {
    logger.error('Error updating category:', error);
    next(error);
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting category:', error);
    next(error);
  }
});

// POST /api/categories/:id/fields - Add field to category
router.post('/:id/fields', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = categoryFieldSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const field = await CategoryField.create({
      ...value,
      category_id: id
    });

    res.status(201).json({
      success: true,
      data: field,
      message: 'Category field created successfully'
    });

  } catch (error) {
    logger.error('Error creating category field:', error);
    next(error);
  }
});

// PUT /api/categories/:categoryId/fields/:fieldId - Update category field
router.put('/:categoryId/fields/:fieldId', async (req, res, next) => {
  try {
    const { categoryId, fieldId } = req.params;
    const { error, value } = categoryFieldSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const field = await CategoryField.findOne({
      where: { id: fieldId, category_id: categoryId }
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Category field not found'
      });
    }

    await field.update(value);

    res.json({
      success: true,
      data: field,
      message: 'Category field updated successfully'
    });

  } catch (error) {
    logger.error('Error updating category field:', error);
    next(error);
  }
});

// DELETE /api/categories/:categoryId/fields/:fieldId - Delete category field
router.delete('/:categoryId/fields/:fieldId', async (req, res, next) => {
  try {
    const { categoryId, fieldId } = req.params;

    const field = await CategoryField.findOne({
      where: { id: fieldId, category_id: categoryId }
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Category field not found'
      });
    }

    await field.destroy();

    res.json({
      success: true,
      message: 'Category field deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting category field:', error);
    next(error);
  }
});

module.exports = router;