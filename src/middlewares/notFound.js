/**
 * Middleware Not Found Handler (404)
 */
const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Rute '${req.originalUrl}' tidak ditemukan pada server ini.`, 404));
};

module.exports = notFound;
