/**
 * Controller Stok Opname
 */
const stockOpnameService = require('../services/stockOpname.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const createOpnameSession = asyncHandler(async (req, res) => {
  const session = await stockOpnameService.createOpnameSession(req.body, req.user);
  return successResponse(res, 'Sesi stok opname berhasil dibuat dan stok telah disesuaikan', session, 201);
});

const getAllOpnameSessions = asyncHandler(async (req, res) => {
  const { rows, meta } = await stockOpnameService.getAllOpnameSessions(req.query);
  return successResponse(res, 'Daftar riwayat sesi stok opname berhasil diambil', rows, 200, meta);
});

const getOpnameSessionById = asyncHandler(async (req, res) => {
  const session = await stockOpnameService.getOpnameSessionById(req.params.id);
  return successResponse(res, 'Detail sesi stok opname berhasil diambil', session, 200);
});

const getSchedule = asyncHandler(async (req, res) => {
  const schedule = await stockOpnameService.getSchedule();
  return successResponse(res, 'Konfigurasi jadwal stok opname berhasil diambil', schedule, 200);
});

const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await stockOpnameService.updateSchedule(req.body);
  return successResponse(res, 'Konfigurasi jadwal stok opname berhasil diperbarui', schedule, 200);
});

const getReminders = asyncHandler(async (req, res) => {
  const reminders = await stockOpnameService.getReminders();
  return successResponse(res, 'Status pengingat stok opname berhasil diperiksa', reminders, 200);
});

module.exports = {
  createOpnameSession,
  getAllOpnameSessions,
  getOpnameSessionById,
  getSchedule,
  updateSchedule,
  getReminders,
};
