const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RawMaterial = sequelize.define(
  'RawMaterial',
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    current_stock: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    min_stock_alert: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    supplier: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: 'raw_materials',
    underscored: true,
    timestamps: false,
  }
);

module.exports = RawMaterial;
