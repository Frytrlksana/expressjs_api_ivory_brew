/**
 * Controller Pengadaan Bahan Baku (Purchase Order)
 */
const purchaseOrderService = require('../services/purchaseOrder.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getAllPurchaseOrders = asyncHandler(async (req, res) => {
  const { rows, meta } = await purchaseOrderService.getAllPurchaseOrders(req.query);
  return successResponse(res, 'Daftar purchase order berhasil diambil', rows, 200, meta);
});

const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const po = await purchaseOrderService.getPurchaseOrderById(req.params.id);
  return successResponse(res, 'Detail purchase order berhasil diambil', po, 200);
});

const createPurchaseOrder = asyncHandler(async (req, res) => {
  const po = await purchaseOrderService.createPurchaseOrder(req.body);
  return successResponse(res, 'Purchase order baru berhasil dibuat', po, 201);
});

const payPurchaseOrder = asyncHandler(async (req, res) => {
  const po = await purchaseOrderService.payPurchaseOrder(req.params.id, req.body);
  return successResponse(res, 'Purchase order berhasil dilunasi', po, 200);
});

const deletePurchaseOrder = asyncHandler(async (req, res) => {
  const result = await purchaseOrderService.deletePurchaseOrder(req.params.id);
  return successResponse(res, 'Purchase order berhasil dihapus', result, 200);
});

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  payPurchaseOrder,
  deletePurchaseOrder,
};
