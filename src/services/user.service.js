/**
 * Service Manajemen Pengguna (Users)
 */
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const { User, Role, ShiftSchedule } = require('../models');
const realtime = require('../utils/realtime');
const { getPagination, getPagingData, getOrder, getSearchClause } = require('../utils/pagination');

const getAllUsers = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const order = getOrder(query.sort, [['name', 'ASC']]);
  const searchClause = getSearchClause(query.search, ['name', 'email', 'role_code', 'station']);

  const whereClause = { ...searchClause };
  if (query.role_code) {
    whereClause.role_code = query.role_code;
  }
  if (query.is_active !== undefined) {
    whereClause.is_active = query.is_active === 'true' || query.is_active === true;
  }

  const data = await User.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['code', 'name', 'badge_color'],
      },
    ],
    order,
    limit,
    offset,
    distinct: true,
  });

  return getPagingData(data, page, limit);
};

const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Role,
        as: 'role',
      },
    ],
  });

  if (!user) {
    throw new AppError('Pengguna tidak ditemukan.', 404);
  }

  return user;
};

const createUser = async (userData) => {
  // Cek apakah email sudah terdaftar
  const existingUser = await User.findOne({ where: { email: userData.email } });
  if (existingUser) {
    throw new AppError('Email sudah digunakan.', 409);
  }

  // Cek validitas role_code
  const role = await Role.findOne({ where: { code: userData.role_code } });
  if (!role) {
    throw new AppError(`Role '${userData.role_code}' tidak ditemukan.`, 404);
  }

  const newUser = await User.create(userData);
  const safeObj = newUser.toSafeObject();
  realtime.broadcast('user:created', { id: newUser.id, role_code: newUser.role_code });
  return safeObj;
};

const updateUser = async (id, updateData) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('Pengguna tidak ditemukan.', 404);
  }

  if (updateData.email && updateData.email !== user.email) {
    const emailExists = await User.findOne({ where: { email: updateData.email } });
    if (emailExists) {
      throw new AppError('Email sudah digunakan oleh pengguna lain.', 409);
    }
  }

  if (updateData.role_code) {
    const role = await Role.findOne({ where: { code: updateData.role_code } });
    if (!role) {
      throw new AppError(`Role '${updateData.role_code}' tidak ditemukan.`, 404);
    }
  }

  Object.assign(user, updateData);
  await user.save();

  const safeObj = user.toSafeObject();
  realtime.broadcast('user:updated', { id: user.id, role_code: user.role_code });
  return safeObj;
};

const toggleUserActive = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('Pengguna tidak ditemukan.', 404);
  }

  user.is_active = !user.is_active;
  await user.save();

  const safeObj = user.toSafeObject();
  realtime.broadcast('user:updated', { id: user.id, is_active: user.is_active });
  return safeObj;
};

const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('Pengguna tidak ditemukan.', 404);
  }

  // Cek relasi data turunan (Shift Schedule)
  const shiftCount = await ShiftSchedule.count({ where: { barista_name: user.name } });
  if (shiftCount > 0) {
    throw new AppError(
      `Pengguna tidak dapat dihapus karena masih terhubung dengan ${shiftCount} jadwal shift. Nonaktifkan akun sebagai alternatif.`,
      400
    );
  }

  await user.destroy();
  realtime.broadcast('user:deleted', { id });
  return { id };
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser,
};
