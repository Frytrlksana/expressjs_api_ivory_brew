/**
 * Middleware Global Error Handler
 */
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Terjadi kesalahan internal pada server';
  let errors = err.errors || [];

  // Tangani Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Data duplikat terdeteksi';
    errors = err.errors.map((e) => ({
      field: e.path,
      message: `${e.path} '${e.value}' sudah terdaftar dalam sistem`,
    }));
  }

  // Tangani Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    statusCode = 422;
    message = 'Validasi database gagal';
    errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Tangani Sequelize Foreign Key Constraint Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Gagal memproses data karena referensi relasi tidak ditemukan atau terkait data lain';
  }

  // Log error di console saat development
  if (config.nodeEnv === 'development' && statusCode === 500) {
    console.error('[Unhandled Error]:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = errorHandler;
