/**
 * Controller Bahan Baku (Raw Material)
 */
const rawMaterialService = require('../services/rawMaterial.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getAllRawMaterials = asyncHandler(async (req, res) => {
  const { rows, meta } = await rawMaterialService.getAllRawMaterials(req.query);
  return successResponse(res, 'Daftar bahan baku berhasil diambil', rows, 200, meta);
});

const getLowStockMaterials = asyncHandler(async (req, res) => {
  const materials = await rawMaterialService.getLowStockMaterials();
  return successResponse(res, 'Daftar bahan baku menipis berhasil diambil', materials, 200);
});

const getRawMaterialById = asyncHandler(async (req, res) => {
  const material = await rawMaterialService.getRawMaterialById(req.params.id);
  return successResponse(res, 'Detail bahan baku berhasil diambil', material, 200);
});

const createRawMaterial = asyncHandler(async (req, res) => {
  const material = await rawMaterialService.createRawMaterial(req.body);
  return successResponse(res, 'Bahan baku baru berhasil ditambahkan', material, 201);
});

const updateRawMaterial = asyncHandler(async (req, res) => {
  const material = await rawMaterialService.updateRawMaterial(req.params.id, req.body);
  return successResponse(res, 'Bahan baku berhasil diperbarui', material, 200);
});

const deleteRawMaterial = asyncHandler(async (req, res) => {
  const result = await rawMaterialService.deleteRawMaterial(req.params.id);
  return successResponse(res, 'Bahan baku berhasil dihapus', result, 200);
});

module.exports = {
  getAllRawMaterials,
  getLowStockMaterials,
  getRawMaterialById,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
};
