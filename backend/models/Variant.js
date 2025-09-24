const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Variant = sequelize.define('Variant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        len: [0, 255]
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    compare_at_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    inventory_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    inventory_management: {
      type: DataTypes.ENUM('shopify', 'manual', 'none'),
      defaultValue: 'manual',
      allowNull: false
    },
    shopify_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true,
      comment: 'Shopify variant ID after export'
    },
    weight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    weight_unit: {
      type: DataTypes.ENUM('g', 'kg', 'oz', 'lb'),
      defaultValue: 'kg',
      allowNull: true
    }
  }, {
    tableName: 'variants',
    timestamps: true,
    indexes: [
      {
        fields: ['product_id']
      },
      {
        unique: true,
        fields: ['sku']
      },
      {
        unique: true,
        fields: ['shopify_id']
      },
      {
        fields: ['price']
      }
    ]
  });

  return Variant;
};