/**
 * Controller Manajemen Role & Permissions
 */
const roleService = require('../services/role.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.getAllRoles();
  return successResponse(res, 'Daftar role berhasil diambil', roles, 200);
});

const getRoleByCode = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleByCode(req.params.code);
  return successResponse(res, 'Detail role berhasil diambil', role, 200);
});

const createRole = asyncHandler(async (req, res) => {
  const role = await roleService.createRole(req.body);
  return successResponse(res, 'Role baru berhasil dibuat', role, 201);
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(req.params.code, req.body);
  return successResponse(res, 'Role berhasil diperbarui', role, 200);
});

const deleteRole = asyncHandler(async (req, res) => {
  const result = await roleService.deleteRole(req.params.code);
  return successResponse(res, 'Role berhasil dihapus', result, 200);
});

const getRolePermissions = asyncHandler(async (req, res) => {
  const permissions = await roleService.getRolePermissions(req.params.code);
  return successResponse(res, 'Daftar izin rute role berhasil diambil', permissions, 200);
});

const updateRolePermissions = asyncHandler(async (req, res) => {
  const permissions = await roleService.updateRolePermissions(
    req.params.code,
    req.body.permissions
  );
  return successResponse(res, 'Izin rute role berhasil diperbarui', permissions, 200);
});

module.exports = {
  getAllRoles,
  getRoleByCode,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
};
