/**
 * Validator Bahan Baku (Raw Material)
 */
const Joi = require('joi');

const createRawMaterialSchema = Joi.object({
  name: Joi.string().max(100).required(),
  category: Joi.string().max(50).required(),
  current_stock: Joi.number().min(0).default(0),
  unit: Joi.string().max(20).required(),
  min_stock_alert: Joi.number().min(0).default(0),
  unit_price: Joi.number().min(0).default(0),
  supplier: Joi.string().max(100).allow(null, '').optional(),
});

const updateRawMaterialSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  category: Joi.string().max(50).optional(),
  current_stock: Joi.number().min(0).optional(),
  unit: Joi.string().max(20).optional(),
  min_stock_alert: Joi.number().min(0).optional(),
  unit_price: Joi.number().min(0).optional(),
  supplier: Joi.string().max(100).allow(null, '').optional(),
}).min(1);

module.exports = {
  createRawMaterialSchema,
  updateRawMaterialSchema,
};
