const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VariantOption = sequelize.define('VariantOption', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    variant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'variants',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    option_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'options',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    option_value: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      },
      comment: 'The specific value chosen for this option (e.g., "Red", "Large")'
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 3
      },
      comment: 'Position of this option in the variant (1=first, 2=second, 3=third)'
    }
  }, {
    tableName: 'variant_options',
    timestamps: true,
    indexes: [
      {
        fields: ['variant_id']
      },
      {
        fields: ['option_id']
      },
      {
        fields: ['variant_id', 'option_id'],
        unique: true,
        name: 'unique_variant_option'
      },
      {
        fields: ['variant_id', 'position'],
        unique: true,
        name: 'unique_variant_position'
      },
      {
        fields: ['option_value']
      }
    ],
    validate: {
      // Validazione custom per assicurare che option_value sia presente nei values dell'Option
      async validateOptionValue() {
        const option = await sequelize.models.Option.findByPk(this.option_id);
        if (option && !option.values.includes(this.option_value)) {
          throw new Error(`Option value "${this.option_value}" is not valid for option "${option.name}". Valid values: ${option.values.join(', ')}`);
        }
      }
    },
    hooks: {
      beforeCreate: async (variantOption) => {
        // Validazione che l'option_value sia presente nei values dell'Option
        const option = await sequelize.models.Option.findByPk(variantOption.option_id);
        if (option && !option.values.includes(variantOption.option_value)) {
          throw new Error(`Option value "${variantOption.option_value}" is not valid for option "${option.name}". Valid values: ${option.values.join(', ')}`);
        }
      },
      beforeUpdate: async (variantOption) => {
        if (variantOption.changed('option_value') || variantOption.changed('option_id')) {
          const option = await sequelize.models.Option.findByPk(variantOption.option_id);
          if (option && !option.values.includes(variantOption.option_value)) {
            throw new Error(`Option value "${variantOption.option_value}" is not valid for option "${option.name}". Valid values: ${option.values.join(', ')}`);
          }
        }
      }
    }
  });

  return VariantOption;
};