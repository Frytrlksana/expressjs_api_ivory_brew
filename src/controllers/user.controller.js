/**
 * Controller Manajemen Pengguna
 */
const userService = require('../services/user.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getAllUsers = asyncHandler(async (req, res) => {
  const { rows, meta } = await userService.getAllUsers(req.query);
  return successResponse(res, 'Daftar pengguna berhasil diambil', rows, 200, meta);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return successResponse(res, 'Detail pengguna berhasil diambil', user, 200);
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  return successResponse(res, 'Pengguna baru berhasil dibuat', user, 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  return successResponse(res, 'Pengguna berhasil diperbarui', user, 200);
});

const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await userService.toggleUserActive(req.params.id);
  return successResponse(res, 'Status aktif pengguna berhasil diubah', user, 200);
});

const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id);
  return successResponse(res, 'Pengguna berhasil dihapus', result, 200);
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser,
};
