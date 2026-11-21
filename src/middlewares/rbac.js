/**
 * Middleware Role-Based Access Control (RBAC) & Route Menu Permissions
 */
const AppError = require('../utils/AppError');
const { RoleMenuPermission } = require('../models');
const { ROLES } = require('../config/constants');

/**
 * Membatasi akses berdasarkan role_code pengguna
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Pengguna belum terautentikasi.', 401));
    }

    if (!allowedRoles.includes(req.user.role_code)) {
      return next(
        new AppError(
          `Role '${req.user.role_code}' tidak memiliki izin untuk mengakses resource ini.`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Validasi akses berdasarkan role_menu_permissions
 * Role 'manager' selalu memiliki hak akses penuh ke seluruh rute.
 */
const checkRoute = (requiredRoute) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Pengguna belum terautentikasi.', 401));
      }

      // Manager bypass
      if (req.user.role_code === ROLES.MANAGER) {
        return next();
      }

      const permission = await RoleMenuPermission.findOne({
        where: {
          role_code: req.user.role_code,
          allowed_route: requiredRoute,
        },
      });

      if (!permission) {
        return next(
          new AppError(
            `Role '${req.user.role_code}' tidak memiliki izin akses menu '${requiredRoute}'.`,
            403
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authorize,
  checkRoute,
};
