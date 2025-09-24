const sequelize = require('../config/database');

// Import all models
const Category = require('./Category')(sequelize);
const CategoryField = require('./CategoryField')(sequelize);
const Product = require('./Product')(sequelize);
const Variant = require('./Variant')(sequelize);
const Option = require('./Option')(sequelize);
const VariantOption = require('./VariantOption')(sequelize);
const Image = require('./Image')(sequelize);
const Attribute = require('./Attribute')(sequelize);

// Define associations
// Category associations
Category.hasMany(CategoryField, {
  foreignKey: 'category_id',
  as: 'fields',
  onDelete: 'CASCADE'
});
CategoryField.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products'
});
Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

// Product associations
Product.hasMany(Variant, {
  foreignKey: 'product_id',
  as: 'variants',
  onDelete: 'CASCADE'
});
Variant.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Product.hasMany(Option, {
  foreignKey: 'product_id',
  as: 'options',
  onDelete: 'CASCADE'
});
Option.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Product.hasMany(Image, {
  foreignKey: 'product_id',
  as: 'images',
  onDelete: 'CASCADE'
});
Image.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Product.hasMany(Attribute, {
  foreignKey: 'product_id',
  as: 'attributes',
  onDelete: 'CASCADE'
});
Attribute.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Variant associations
Variant.hasMany(Image, {
  foreignKey: 'variant_id',
  as: 'images',
  onDelete: 'CASCADE'
});
Image.belongsTo(Variant, {
  foreignKey: 'variant_id',
  as: 'variant'
});

Variant.hasMany(Attribute, {
  foreignKey: 'variant_id',
  as: 'attributes',
  onDelete: 'CASCADE'
});
Attribute.belongsTo(Variant, {
  foreignKey: 'variant_id',
  as: 'variant'
});

// Variant-Option many-to-many associations through VariantOption junction table
Variant.belongsToMany(Option, {
  through: VariantOption,
  foreignKey: 'variant_id',
  otherKey: 'option_id',
  as: 'options'
});
Option.belongsToMany(Variant, {
  through: VariantOption,
  foreignKey: 'option_id',
  otherKey: 'variant_id',
  as: 'variants'
});

// Direct associations with VariantOption for detailed access
Variant.hasMany(VariantOption, {
  foreignKey: 'variant_id',
  as: 'variantOptions',
  onDelete: 'CASCADE'
});
VariantOption.belongsTo(Variant, {
  foreignKey: 'variant_id',
  as: 'variant'
});

Option.hasMany(VariantOption, {
  foreignKey: 'option_id',
  as: 'variantOptions',
  onDelete: 'CASCADE'
});
VariantOption.belongsTo(Option, {
  foreignKey: 'option_id',
  as: 'option'
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  Category,
  CategoryField,
  Product,
  Variant,
  Option,
  VariantOption,
  Image,
  Attribute
};