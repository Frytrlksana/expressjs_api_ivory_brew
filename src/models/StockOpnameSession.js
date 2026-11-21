const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockOpnameSession = sequelize.define(
  'StockOpnameSession',
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    opname_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    cadence: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    auditor_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    scope: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    total_discrepancy_items: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_loss_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_surplus_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    auto_expense_created: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'stock_opname_sessions',
    underscored: true,
    timestamps: false,
  }
);

module.exports = StockOpnameSession;
