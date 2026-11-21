const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const config = require('../config/env');

const User = sequelize.define(
  'User',
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
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    station: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'users',
    underscored: true,
    timestamps: false,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          // Jangan hash ulang jika password sudah berupa hash bcrypt
          const isAlreadyHashed = typeof user.password === 'string' && /^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/.test(user.password);
          if (!isAlreadyHashed) {
            user.password = await bcrypt.hash(user.password, config.bcrypt.saltRounds);
          }
        }
      },
    },
  }
);

// Method untuk verifikasi password
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method untuk menghapus password dari objek JSON
User.prototype.toSafeObject = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
