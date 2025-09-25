const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Image = sequelize.define('Image', {
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
      allowNull: false,
      references: {
        model: 'variants',
        key: 'id'
      }
    },
    src: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 500]
      }
    },
    alt_text: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'File size in bytes'
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Original filename'
    }
  }, {
    tableName: 'images',
    timestamps: true,
    indexes: [
      {
        fields: ['product_id']
      },
      {
        fields: ['variant_id']
      },
      {
        fields: ['product_id', 'position']
      }
    ]
  });

  return Image;
};