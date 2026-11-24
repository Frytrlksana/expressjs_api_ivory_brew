const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomerMember = sequelize.define(
  'CustomerMember',
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    stamps: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_cups_purchased: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    stamps_claimed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    favorite_drink: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('favorite_drink');
        if (!rawValue) return null;
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return null;
        }
      },
      set(val) {
        if (typeof val === 'object' && val !== null) {
          this.setDataValue('favorite_drink', JSON.stringify(val));
        } else {
          this.setDataValue('favorite_drink', val);
        }
      },
    },
    last_visit: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'customer_members',
    underscored: true,
    timestamps: false,
  }
);

module.exports = CustomerMember;
