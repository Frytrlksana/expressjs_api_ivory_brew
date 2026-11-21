/**
 * Controller Produk & Menu
 */
const productService = require('../services/product.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getAllProducts = asyncHandler(async (req, res) => {
  const { rows, meta } = await productService.getAllProducts(req.query);
  return successResponse(res, 'Daftar produk berhasil diambil', rows, 200, meta);
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  return successResponse(res, 'Detail produk berhasil diambil', product, 200);
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  return successResponse(res, 'Produk baru berhasil ditambahkan', product, 201);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  return successResponse(res, 'Produk berhasil diperbarui', product, 200);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  return successResponse(res, 'Produk berhasil dihapus', result, 200);
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
