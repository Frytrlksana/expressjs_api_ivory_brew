/**
 * Controller Beban / Pengeluaran (Expenses)
 */
const expenseService = require('../services/expense.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getAllExpenses = asyncHandler(async (req, res) => {
  const { rows, meta } = await expenseService.getAllExpenses(req.query);
  return successResponse(res, 'Daftar pengeluaran berhasil diambil', rows, 200, meta);
});

const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpenseById(req.params.id);
  return successResponse(res, 'Detail pengeluaran berhasil diambil', expense, 200);
});

const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.body);
  return successResponse(res, 'Pengeluaran baru berhasil dicatat', expense, 201);
});

const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.updateExpense(req.params.id, req.body);
  return successResponse(res, 'Pengeluaran berhasil diperbarui', expense, 200);
});

const deleteExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.deleteExpense(req.params.id);
  return successResponse(res, 'Pengeluaran berhasil dihapus', result, 200);
});

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
