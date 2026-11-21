/**
 * Controller Jadwal Shift Barista
 */
const shiftService = require('../services/shift.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getAllShifts = asyncHandler(async (req, res) => {
  const { rows, meta } = await shiftService.getAllShifts(req.query);
  return successResponse(res, 'Daftar jadwal shift berhasil diambil', rows, 200, meta);
});

const getShiftById = asyncHandler(async (req, res) => {
  const shift = await shiftService.getShiftById(req.params.id);
  return successResponse(res, 'Detail jadwal shift berhasil diambil', shift, 200);
});

const createShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.createShift(req.body);
  return successResponse(res, 'Jadwal shift berhasil dibuat', shift, 201);
});

const updateShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.updateShift(req.params.id, req.body);
  return successResponse(res, 'Jadwal shift berhasil diperbarui', shift, 200);
});

const deleteShift = asyncHandler(async (req, res) => {
  const result = await shiftService.deleteShift(req.params.id);
  return successResponse(res, 'Jadwal shift berhasil dihapus', result, 200);
});

module.exports = {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
};
