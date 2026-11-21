/**
 * Service Jadwal Shift Barista
 */
const AppError = require('../utils/AppError');
const { ShiftSchedule, User } = require('../models');
const { getPagination, getPagingData, getOrder, getSearchClause } = require('../utils/pagination');
const realtime = require('../utils/realtime');

const getAllShifts = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const order = getOrder(query.sort, [['start_time', 'ASC']]);
  const searchClause = getSearchClause(query.search, ['name', 'barista_name', 'station', 'days_active']);

  const whereClause = { ...searchClause };
  if (query.is_active !== undefined) {
    whereClause.is_active = query.is_active === 'true' || query.is_active === true;
  }
  if (query.station) {
    whereClause.station = query.station;
  }
  if (query.barista_name) {
    whereClause.barista_name = query.barista_name;
  }

  const data = await ShiftSchedule.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'barista',
        attributes: ['id', 'name', 'email', 'avatar'],
      },
    ],
    order,
    limit,
    offset,
  });

  return getPagingData(data, page, limit);
};

const getShiftById = async (id) => {
  const shift = await ShiftSchedule.findByPk(id, {
    include: [
      {
        model: User,
        as: 'barista',
        attributes: ['id', 'name', 'email', 'avatar'],
      },
    ],
  });

  if (!shift) {
    throw new AppError('Jadwal shift tidak ditemukan.', 404);
  }

  return shift;
};

const createShift = async (shiftData) => {
  // Validasi keberadaan barista_name di tabel users
  const user = await User.findOne({ where: { name: shiftData.barista_name } });
  if (!user) {
    throw new AppError(`Barista dengan nama '${shiftData.barista_name}' tidak terdaftar di sistem.`, 404);
  }

  const created = await ShiftSchedule.create(shiftData);
  realtime.broadcast('shift:created', { id: created.id, barista_name: created.barista_name });
  return created;
};

const updateShift = async (id, updateData) => {
  const shift = await ShiftSchedule.findByPk(id);
  if (!shift) {
    throw new AppError('Jadwal shift tidak ditemukan.', 404);
  }

  if (updateData.barista_name && updateData.barista_name !== shift.barista_name) {
    const user = await User.findOne({ where: { name: updateData.barista_name } });
    if (!user) {
      throw new AppError(`Barista dengan nama '${updateData.barista_name}' tidak terdaftar di sistem.`, 404);
    }
  }

  Object.assign(shift, updateData);
  await shift.save();

  realtime.broadcast('shift:updated', { id: shift.id, barista_name: shift.barista_name });
  return shift;
};

const deleteShift = async (id) => {
  const shift = await ShiftSchedule.findByPk(id);
  if (!shift) {
    throw new AppError('Jadwal shift tidak ditemukan.', 404);
  }

  await shift.destroy();
  realtime.broadcast('shift:deleted', { id });
  return { id };
};

module.exports = {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
};
