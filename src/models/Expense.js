const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expense = sequelize.define(
  'Expense',
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    reference_po_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    reference_so_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
  },
  {
    tableName: 'expenses',
    underscored: true,
    timestamps: false,
  }
);

module.exports = Expense;
