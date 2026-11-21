/**
 * Middleware Autentikasi JWT
 */
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const { User, Role } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Akses ditolak. Token autentikasi tidak ditemukan.', 401));
    }

    // Verifikasi Token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Sesi login telah kedaluwarsa. Silakan login kembali.', 401));
      }
      return next(new AppError('Token tidak valid.', 401));
    }

    // Cari User aktif di DB
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Role,
          as: 'role',
        },
      ],
    });

    if (!user) {
      return next(new AppError('Pengguna pemilik token ini sudah tidak terdaftar.', 401));
    }

    if (!user.is_active) {
      return next(new AppError('Akun Anda dinonaktifkan. Hubungi Manajer.', 403));
    }

    // Simpan objek user di req.user (tanpa password)
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
};
