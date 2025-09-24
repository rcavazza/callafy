const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CategoryField = sequelize.define('CategoryField', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    field_type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'date', 'text', 'select'),
      allowNull: false,
      defaultValue: 'string'
    },
    required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    options: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'For select type fields, stores available options'
    },
    default_value: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'category_fields',
    timestamps: true,
    indexes: [
      {
        fields: ['category_id']
      },
      {
        fields: ['category_id', 'position']
      },
      {
        unique: true,
        fields: ['category_id', 'name'],
        name: 'unique_category_field_name'
      }
    ]
  });

  return CategoryField;
};