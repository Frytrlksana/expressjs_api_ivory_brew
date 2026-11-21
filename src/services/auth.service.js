/**
 * Service Autentikasi Pengguna
 */
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const { User, Role, RoleMenuPermission } = require('../models');

const login = async (email, password) => {
  const user = await User.findOne({
    where: { email },
    include: [
      {
        model: Role,
        as: 'role',
        include: [
          {
            model: RoleMenuPermission,
            as: 'permissions',
          },
        ],
      },
    ],
  });

  if (!user) {
    throw new AppError('Email atau password salah.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Email atau password salah.', 401);
  }

  if (!user.is_active) {
    throw new AppError('Akun Anda dinonaktifkan. Hubungi Manajer.', 403);
  }

  // Generate JWT Token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role_code: user.role_code,
      name: user.name,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );

  return {
    user: user.toSafeObject(),
    token,
  };
};

const getMe = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: 'role',
        include: [
          {
            model: RoleMenuPermission,
            as: 'permissions',
          },
        ],
      },
    ],
  });

  if (!user) {
    throw new AppError('Pengguna tidak ditemukan.', 404);
  }

  return user.toSafeObject();
};

module.exports = {
  login,
  getMe,
};
