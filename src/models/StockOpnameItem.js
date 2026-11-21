const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockOpnameItem = sequelize.define(
  'StockOpnameItem',
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    item_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    item_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    system_stock: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    physical_stock: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    difference: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    unit_cost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    difference_cost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'stock_opname_items',
    underscored: true,
    timestamps: false,
  }
);

module.exports = StockOpnameItem;
