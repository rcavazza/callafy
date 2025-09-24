const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Option = sequelize.define('Option', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      validate: {
        min: 1,
        max: 3
      }
    },
    values: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of option values'
    }
  }, {
    tableName: 'options',
    timestamps: true,
    indexes: [
      {
        fields: ['product_id']
      },
      {
        fields: ['product_id', 'position']
      },
      {
        unique: true,
        fields: ['product_id', 'name']
      }
    ]
  });

  return Option;
};