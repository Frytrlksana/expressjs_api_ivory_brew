const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShiftSchedule = sequelize.define(
  'ShiftSchedule',
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
    start_time: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    end_time: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    barista_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    station: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    days_active: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'shift_schedules',
    underscored: true,
    timestamps: false,
  }
);

module.exports = ShiftSchedule;
