/**
 * Controller Autentikasi Pengguna
 */
const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  return successResponse(res, 'Login berhasil', result, 200);
});

const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.id);

  return successResponse(res, 'Data profil berhasil diambil', result, 200);
});

const logout = asyncHandler(async (req, res) => {
  // Stateless JWT logout
  return successResponse(res, 'Logout berhasil', null, 200);
});

module.exports = {
  login,
  getMe,
  logout,
};
