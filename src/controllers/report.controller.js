/**
 * Controller Laporan (Reports)
 */
const reportService = require('../services/report.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getSalesSummary = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const summary = await reportService.getSalesSummary(from, to);
  return successResponse(res, 'Ringkasan penjualan berhasil dihitung', summary, 200);
});

const getBestSellers = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const bestSellers = await reportService.getBestSellers(limit);
  return successResponse(res, 'Daftar produk terlaris berhasil diambil', bestSellers, 200);
});

const getProfitLoss = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const pnl = await reportService.getProfitLoss(from, to);
  return successResponse(res, 'Laporan laba rugi berhasil dihitung', pnl, 200);
});

const getCashflow = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const cashflow = await reportService.getCashflow(from, to);
  return successResponse(res, 'Laporan arus kas berhasil dihitung', cashflow, 200);
});

module.exports = {
  getSalesSummary,
  getBestSellers,
  getProfitLoss,
  getCashflow,
};
