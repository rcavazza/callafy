const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { Product, Variant, Option, VariantOption } = require('../models');
const logger = require('../config/logger');

// Validation schemas
const generateVariantsSchema = Joi.object({
  mode: Joi.string().valid('all', 'selective').default('all'),
  combinations: Joi.array().items(
    Joi.object({
      options: Joi.array().items(
        Joi.object({
          option_id: Joi.number().integer().required(),
          value: Joi.string().required(),
          position: Joi.number().integer().min(1).max(3).required()
        })
      ).required(),
      price: Joi.number().min(0).default(0),
      compare_at_price: Joi.number().min(0).optional(),
      inventory_quantity: Joi.number().integer().min(0).default(0),
      sku: Joi.string().optional(),
      barcode: Joi.string().optional(),
      weight: Joi.number().min(0).optional(),
      weight_unit: Joi.string().valid('g', 'kg', 'oz', 'lb').default('kg')
    })
  ).optional()
});

const createVariantSchema = Joi.object({
  price: Joi.number().min(0).required(),
  compare_at_price: Joi.number().min(0).optional(),
  inventory_quantity: Joi.number().integer().min(0).default(0),
  sku: Joi.string().optional(),
  barcode: Joi.string().optional(),
  weight: Joi.number().min(0).optional(),
  weight_unit: Joi.string().valid('g', 'kg', 'oz', 'lb').default('kg'),
  options: Joi.array().items(
    Joi.object({
      option_id: Joi.number().integer().required(),
      value: Joi.string().required(),
      position: Joi.number().integer().min(1).max(3).required()
    })
  ).required()
});

const bulkUpdateSchema = Joi.object({
  variants: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().required(),
      price: Joi.number().min(0).optional(),
      compare_at_price: Joi.number().min(0).optional(),
      inventory_quantity: Joi.number().integer().min(0).optional(),
      sku: Joi.string().optional(),
      barcode: Joi.string().optional(),
      weight: Joi.number().min(0).optional(),
      weight_unit: Joi.string().valid('g', 'kg', 'oz', 'lb').optional()
    }).min(2) // At least id and one other field must be provided
  ).required()
});

// Helper function to generate all possible combinations
function generateCombinations(options) {
  if (options.length === 0) return [];
  if (options.length === 1) {
    return options[0].values.map(value => [{ option_id: options[0].id, value, position: 1 }]);
  }

  const result = [];
  const firstOption = options[0];
  const restCombinations = generateCombinations(options.slice(1));

  for (const value of firstOption.values) {
    for (const restCombination of restCombinations) {
      const combination = [
        { option_id: firstOption.id, value, position: 1 },
        ...restCombination.map(opt => ({ ...opt, position: opt.position + 1 }))
      ];
      result.push(combination);
    }
  }

  return result;
}

// Helper function to check if combination already exists
async function combinationExists(productId, combination) {
  const existingVariants = await Variant.findAll({
    where: { product_id: productId },
    include: [{
      model: VariantOption,
      as: 'variantOptions',
      include: [{
        model: Option,
        as: 'option'
      }]
    }]
  });

  for (const variant of existingVariants) {
    const variantOptions = variant.variantOptions.sort((a, b) => a.position - b.position);
    const sortedCombination = combination.sort((a, b) => a.position - b.position);

    if (variantOptions.length === sortedCombination.length) {
      const matches = variantOptions.every((vo, index) => 
        vo.option_id === sortedCombination[index].option_id && 
        vo.option_value === sortedCombination[index].value
      );
      if (matches) return true;
    }
  }

  return false;
}

// GET /api/products/:productId/variants - Get all variants for a product
router.get('/products/:productId/variants', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variants = await Variant.findAll({
      where: { product_id: productId },
      include: [{
        model: VariantOption,
        as: 'variantOptions',
        include: [{
          model: Option,
          as: 'option'
        }]
      }],
      order: [['id', 'ASC'], [{ model: VariantOption, as: 'variantOptions' }, 'position', 'ASC']]
    });

    // Format response with option details
    const formattedVariants = variants.map(variant => ({
      ...variant.toJSON(),
      selectedOptions: variant.variantOptions.map(vo => ({
        name: vo.option.name,
        value: vo.option_value,
        position: vo.position
      }))
    }));

    res.json({
      success: true,
      variants: formattedVariants
    });

  } catch (error) {
    logger.error('Error fetching variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products/:productId/variants/generate - Generate variants automatically
router.post('/products/:productId/variants/generate', async (req, res) => {
  try {
    const { productId } = req.params;
    const { error, value } = generateVariantsSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { mode, combinations } = value;

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get product options
    const options = await Option.findAll({
      where: { product_id: productId },
      order: [['position', 'ASC']]
    });

    if (options.length === 0) {
      return res.status(400).json({ error: 'Product must have options before generating variants' });
    }

    let combinationsToCreate = [];

    if (mode === 'all') {
      // Generate all possible combinations
      const allCombinations = generateCombinations(options);
      combinationsToCreate = allCombinations.map(combo => ({
        options: combo,
        price: 0,
        inventory_quantity: 0
      }));
    } else if (mode === 'selective' && combinations) {
      // Use provided combinations
      combinationsToCreate = combinations;
    } else {
      return res.status(400).json({ error: 'Invalid mode or missing combinations for selective mode' });
    }

    const createdVariants = [];
    const skippedCombinations = [];

    // Create variants in transaction
    await Product.sequelize.transaction(async (transaction) => {
      for (const combo of combinationsToCreate) {
        // Check if combination already exists
        const exists = await combinationExists(productId, combo.options);
        if (exists) {
          skippedCombinations.push(combo);
          continue;
        }

        // Create variant
        const variant = await Variant.create({
          product_id: productId,
          price: combo.price || 0,
          compare_at_price: combo.compare_at_price,
          inventory_quantity: combo.inventory_quantity || 0,
          sku: combo.sku,
          barcode: combo.barcode,
          weight: combo.weight,
          weight_unit: combo.weight_unit || 'kg'
        }, { transaction });

        // Create variant-option associations
        for (const option of combo.options) {
          await VariantOption.create({
            variant_id: variant.id,
            option_id: option.option_id,
            option_value: option.value,
            position: option.position
          }, { transaction });
        }

        createdVariants.push(variant);
      }
    });

    logger.info(`Generated ${createdVariants.length} variants for product ${productId}`);

    res.json({
      success: true,
      message: `Generated ${createdVariants.length} variants`,
      created: createdVariants.length,
      skipped: skippedCombinations.length,
      variants: createdVariants
    });

  } catch (error) {
    logger.error('Error generating variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products/:productId/variants - Create single variant manually
router.post('/products/:productId/variants', async (req, res) => {
  try {
    const { productId } = req.params;
    const { error, value } = createVariantSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if combination already exists
    const exists = await combinationExists(productId, value.options);
    if (exists) {
      return res.status(400).json({ error: 'A variant with this option combination already exists' });
    }

    let createdVariant;

    // Create variant in transaction
    await Product.sequelize.transaction(async (transaction) => {
      // Create variant
      createdVariant = await Variant.create({
        product_id: productId,
        price: value.price,
        compare_at_price: value.compare_at_price,
        inventory_quantity: value.inventory_quantity,
        sku: value.sku,
        barcode: value.barcode,
        weight: value.weight,
        weight_unit: value.weight_unit
      }, { transaction });

      // Create variant-option associations
      for (const option of value.options) {
        await VariantOption.create({
          variant_id: createdVariant.id,
          option_id: option.option_id,
          option_value: option.value,
          position: option.position
        }, { transaction });
      }
    });

    // Fetch created variant with associations
    const variant = await Variant.findByPk(createdVariant.id, {
      include: [{
        model: VariantOption,
        as: 'variantOptions',
        include: [{
          model: Option,
          as: 'option'
        }]
      }]
    });

    logger.info(`Created variant ${variant.id} for product ${productId}`);

    res.status(201).json({
      success: true,
      message: 'Variant created successfully',
      variant: {
        ...variant.toJSON(),
        selectedOptions: variant.variantOptions.map(vo => ({
          name: vo.option.name,
          value: vo.option_value,
          position: vo.position
        }))
      }
    });

  } catch (error) {
    logger.error('Error creating variant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:productId/variants/available-combinations - Get available combinations
router.get('/products/:productId/variants/available-combinations', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get product options
    const options = await Option.findAll({
      where: { product_id: productId },
      order: [['position', 'ASC']]
    });

    if (options.length === 0) {
      return res.json({
        success: true,
        availableCombinations: [],
        message: 'No options defined for this product'
      });
    }

    // Generate all possible combinations
    const allCombinations = generateCombinations(options);
    
    // Filter out existing combinations
    const availableCombinations = [];
    for (const combo of allCombinations) {
      const exists = await combinationExists(productId, combo);
      if (!exists) {
        availableCombinations.push({
          options: combo.map(opt => ({
            option_id: opt.option_id,
            option_name: options.find(o => o.id === opt.option_id)?.name,
            value: opt.value,
            position: opt.position
          }))
        });
      }
    }

    res.json({
      success: true,
      availableCombinations,
      total: availableCombinations.length
    });

  } catch (error) {
    logger.error('Error fetching available combinations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/products/:productId/variants/bulk - Bulk update variants
router.put('/products/:productId/variants/bulk', async (req, res) => {
  try {
    const { productId } = req.params;
    const { error, value } = bulkUpdateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedVariants = [];

    // Update variants in transaction
    await Product.sequelize.transaction(async (transaction) => {
      for (const variantData of value.variants) {
        const variant = await Variant.findOne({
          where: { 
            id: variantData.id,
            product_id: productId 
          }
        });

        if (!variant) {
          throw new Error(`Variant ${variantData.id} not found or doesn't belong to product ${productId}`);
        }

        // Update only provided fields
        const updateData = {};
        ['price', 'compare_at_price', 'inventory_quantity', 'sku', 'barcode', 'weight', 'weight_unit']
          .forEach(field => {
            if (variantData[field] !== undefined) {
              updateData[field] = variantData[field];
            }
          });

        await variant.update(updateData, { transaction });
        updatedVariants.push(variant);
      }
    });

    logger.info(`Bulk updated ${updatedVariants.length} variants for product ${productId}`);

    res.json({
      success: true,
      message: `Updated ${updatedVariants.length} variants`,
      updated: updatedVariants.length
    });

  } catch (error) {
    logger.error('Error bulk updating variants:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/products/:productId/variants/:variantId - Delete variant
router.delete('/products/:productId/variants/:variantId', async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const variant = await Variant.findOne({
      where: { 
        id: variantId,
        product_id: productId 
      }
    });

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    await variant.destroy();

    logger.info(`Deleted variant ${variantId} from product ${productId}`);

    res.json({
      success: true,
      message: 'Variant deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting variant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;