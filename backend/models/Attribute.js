const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Attribute = sequelize.define('Attribute', {
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
    variant_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'variants',
        key: 'id'
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'custom',
      validate: {
        len: [0, 255]
      }
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    value_type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'date', 'json'),
      defaultValue: 'string',
      allowNull: false
    },
    namespace: {
      type: DataTypes.STRING,
      defaultValue: 'custom',
      allowNull: false,
      validate: {
        len: [1, 255]
      }
    }
  }, {
    tableName: 'attributes',
    timestamps: true,
    indexes: [
      {
        fields: ['product_id']
      },
      {
        fields: ['variant_id']
      },
      {
        fields: ['namespace']
      },
      {
        fields: ['key']
      },
      {
        unique: true,
        fields: ['product_id', 'variant_id', 'namespace', 'key'],
        name: 'unique_attribute_per_entity'
      }
    ]
  });

  return Attribute;
};