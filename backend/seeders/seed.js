const { sequelize, Category, CategoryField, Product, Variant, Option, Image, Attribute } = require('../models');
const logger = require('../config/logger');

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Create sample categories
    const electronicsCategory = await Category.create({
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      shopify_product_type: 'Electronics',
      status: 'active'
    });

    const clothingCategory = await Category.create({
      name: 'Clothing',
      description: 'Apparel and fashion items',
      shopify_product_type: 'Apparel & Accessories',
      status: 'active'
    });

    // Create category fields for Electronics
    await CategoryField.create({
      category_id: electronicsCategory.id,
      name: 'Brand',
      field_type: 'string',
      required: true,
      position: 1
    });

    await CategoryField.create({
      category_id: electronicsCategory.id,
      name: 'Model',
      field_type: 'string',
      required: true,
      position: 2
    });

    await CategoryField.create({
      category_id: electronicsCategory.id,
      name: 'Warranty Period',
      field_type: 'select',
      required: false,
      position: 3,
      options: ['6 months', '1 year', '2 years', '3 years']
    });

    // Create category fields for Clothing
    await CategoryField.create({
      category_id: clothingCategory.id,
      name: 'Material',
      field_type: 'string',
      required: true,
      position: 1
    });

    await CategoryField.create({
      category_id: clothingCategory.id,
      name: 'Care Instructions',
      field_type: 'text',
      required: false,
      position: 2
    });

    // Create sample products
    const smartphone = await Product.create({
      title: 'Smartphone Pro Max',
      description: 'Latest flagship smartphone with advanced features',
      vendor: 'TechCorp',
      product_type: 'Smartphone',
      tags: 'electronics,mobile,smartphone,flagship',
      handle: 'smartphone-pro-max',
      status: 'active',
      category_id: electronicsCategory.id
    });

    const tshirt = await Product.create({
      title: 'Cotton T-Shirt',
      description: 'Comfortable cotton t-shirt for everyday wear',
      vendor: 'FashionBrand',
      product_type: 'T-Shirt',
      tags: 'clothing,cotton,casual,tshirt',
      handle: 'cotton-t-shirt',
      status: 'active',
      category_id: clothingCategory.id
    });

    // Create options for smartphone
    await Option.create({
      product_id: smartphone.id,
      name: 'Color',
      position: 1,
      values: ['Black', 'White', 'Blue', 'Red']
    });

    await Option.create({
      product_id: smartphone.id,
      name: 'Storage',
      position: 2,
      values: ['128GB', '256GB', '512GB']
    });

    // Create options for t-shirt
    await Option.create({
      product_id: tshirt.id,
      name: 'Size',
      position: 1,
      values: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    });

    await Option.create({
      product_id: tshirt.id,
      name: 'Color',
      position: 2,
      values: ['White', 'Black', 'Navy', 'Gray']
    });

    // Create variants for smartphone
    const smartphoneVariants = [
      { option1: 'Black', option2: '128GB', sku: 'PHONE-BLK-128', price: 999.99 },
      { option1: 'Black', option2: '256GB', sku: 'PHONE-BLK-256', price: 1099.99 },
      { option1: 'White', option2: '128GB', sku: 'PHONE-WHT-128', price: 999.99 },
      { option1: 'Blue', option2: '512GB', sku: 'PHONE-BLU-512', price: 1299.99 }
    ];

    for (const variantData of smartphoneVariants) {
      await Variant.create({
        product_id: smartphone.id,
        ...variantData,
        inventory_quantity: 50,
        inventory_management: 'manual',
        weight: 0.2,
        weight_unit: 'kg'
      });
    }

    // Create variants for t-shirt
    const tshirtVariants = [
      { option1: 'M', option2: 'White', sku: 'TSHIRT-M-WHT', price: 29.99 },
      { option1: 'L', option2: 'Black', sku: 'TSHIRT-L-BLK', price: 29.99 },
      { option1: 'XL', option2: 'Navy', sku: 'TSHIRT-XL-NAV', price: 29.99 }
    ];

    for (const variantData of tshirtVariants) {
      await Variant.create({
        product_id: tshirt.id,
        ...variantData,
        inventory_quantity: 100,
        inventory_management: 'manual',
        weight: 0.15,
        weight_unit: 'kg'
      });
    }

    // Create sample attributes
    await Attribute.create({
      product_id: smartphone.id,
      key: 'brand',
      value: 'TechCorp',
      value_type: 'string',
      namespace: 'product_info'
    });

    await Attribute.create({
      product_id: smartphone.id,
      key: 'model',
      value: 'Pro Max 2024',
      value_type: 'string',
      namespace: 'product_info'
    });

    await Attribute.create({
      product_id: tshirt.id,
      key: 'material',
      value: '100% Cotton',
      value_type: 'string',
      namespace: 'product_info'
    });

    logger.info('Database seeding completed successfully!');
    logger.info(`Created ${await Category.count()} categories`);
    logger.info(`Created ${await CategoryField.count()} category fields`);
    logger.info(`Created ${await Product.count()} products`);
    logger.info(`Created ${await Variant.count()} variants`);
    logger.info(`Created ${await Option.count()} options`);
    logger.info(`Created ${await Attribute.count()} attributes`);

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;