const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RecipeItem = sequelize.define(
  'RecipeItem',
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    recipe_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    material_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    tableName: 'recipe_items',
    underscored: true,
    timestamps: false,
  }
);

module.exports = RecipeItem;
