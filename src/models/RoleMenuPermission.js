const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoleMenuPermission = sequelize.define(
  'RoleMenuPermission',
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    allowed_route: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: 'role_menu_permissions',
    underscored: true,
    timestamps: false,
  }
);

module.exports = RoleMenuPermission;
