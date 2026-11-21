/**
 * Validator Purchase Order (PO)
 */
const Joi = require('joi');
const { PO_STATUS, PAYMENT_METHODS_PO } = require('../config/constants');

const poItemSchema = Joi.object({
  material_id: Joi.string().uuid().required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().max(20).required(),
  unit_price: Joi.number().min(0).required(),
});

const createPoSchema = Joi.object({
  supplier: Joi.string().max(100).required(),
  date: Joi.date().iso().required(),
  status: Joi.string().valid(...Object.values(PO_STATUS)).required(),
  payment_method: Joi.string().valid(...PAYMENT_METHODS_PO).required(),
  due_date: Joi.date().iso().when('status', {
    is: PO_STATUS.TEMPO,
    then: Joi.required().messages({
      'any.required': 'due_date wajib diisi jika status PO adalah tempo',
    }),
    otherwise: Joi.allow(null, '').optional(),
  }),
  notes: Joi.string().allow(null, '').optional(),
  items: Joi.array().items(poItemSchema).min(1).required().messages({
    'array.min': 'Purchase order minimal memiliki 1 item barang',
  }),
});

const payPoSchema = Joi.object({
  payment_method: Joi.string().valid(...PAYMENT_METHODS_PO).default('kas'),
});

module.exports = {
  createPoSchema,
  payPoSchema,
};
