const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    product_type: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Comma-separated tags'
    },
    handle: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        len: [0, 255]
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'draft'),
      defaultValue: 'draft',
      allowNull: false
    },
    shopify_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true,
      comment: 'Shopify product ID after export'
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  }, {
    tableName: 'products',
    timestamps: true,
    indexes: [
      {
        fields: ['category_id']
      },
      {
        fields: ['status']
      },
      {
        unique: true,
        fields: ['handle']
      },
      {
        unique: true,
        fields: ['shopify_id']
      },
      {
        fields: ['title']
      }
    ],
    hooks: {
      beforeCreate: (product) => {
        if (!product.handle && product.title) {
          product.handle = product.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
      },
      beforeUpdate: (product) => {
        if (product.changed('title') && !product.changed('handle')) {
          product.handle = product.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
      }
    }
  });

  return Product;
};