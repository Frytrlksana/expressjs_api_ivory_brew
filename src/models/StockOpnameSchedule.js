const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockOpnameSchedule = sequelize.define(
  'StockOpnameSchedule',
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    primary_cadence: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'monthly',
    },
    daily_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    daily_target_time: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '21:30',
    },
    weekly_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    weekly_day: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // 0 = Minggu
    },
    monthly_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    monthly_day: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 28,
    },
    monthly_reminder_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    default_scope: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'all',
    },
    default_auto_expense: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'stock_opname_schedules',
    underscored: true,
    timestamps: false,
  }
);

module.exports = StockOpnameSchedule;
