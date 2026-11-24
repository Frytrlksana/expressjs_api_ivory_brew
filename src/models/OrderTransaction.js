const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderTransaction = sequelize.define(
  'OrderTransaction',
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    receipt_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    cashier_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    order_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    table_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    customer_phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    cash_given: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    change: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'completed',
    },
  },
  {
    tableName: 'order_transactions',
    underscored: true,
    timestamps: false,
  }
);

module.exports = OrderTransaction;
