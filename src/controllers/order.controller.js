/**
 * Controller Transaksi Kasir (Orders / POS)
 */
const orderService = require('../services/order.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const checkoutOrder = asyncHandler(async (req, res) => {
  const order = await orderService.checkoutOrder(req.body, req.user);
  return successResponse(res, 'Checkout pesanan berhasil diproses', order, 201);
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { rows, meta } = await orderService.getAllOrders(req.query);
  return successResponse(res, 'Daftar transaksi order berhasil diambil', rows, 200, meta);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  return successResponse(res, 'Detail transaksi order berhasil diambil', order, 200);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id);
  return successResponse(res, 'Transaksi order berhasil dibatalkan dan stok dikembalikan', order, 200);
});

module.exports = {
  checkoutOrder,
  getAllOrders,
  getOrderById,
  cancelOrder,
};
