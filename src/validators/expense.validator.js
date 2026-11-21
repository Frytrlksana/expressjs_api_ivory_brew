/**
 * Validator Beban / Pengeluaran (Expense)
 */
const Joi = require('joi');
const { EXPENSE_CATEGORIES, PAYMENT_METHODS_EXPENSE } = require('../config/constants');

const createExpenseSchema = Joi.object({
  date: Joi.date().iso().required(),
  category: Joi.string().valid(...EXPENSE_CATEGORIES).required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().required(),
  payment_method: Joi.string().valid(...PAYMENT_METHODS_EXPENSE).required(),
  reference_po_id: Joi.string().uuid().allow(null, '').optional(),
  reference_so_id: Joi.string().uuid().allow(null, '').optional(),
});

const updateExpenseSchema = Joi.object({
  date: Joi.date().iso().optional(),
  category: Joi.string().valid(...EXPENSE_CATEGORIES).optional(),
  amount: Joi.number().positive().optional(),
  description: Joi.string().optional(),
  payment_method: Joi.string().valid(...PAYMENT_METHODS_EXPENSE).optional(),
  reference_po_id: Joi.string().uuid().allow(null, '').optional(),
  reference_so_id: Joi.string().uuid().allow(null, '').optional(),
}).min(1);

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
};
