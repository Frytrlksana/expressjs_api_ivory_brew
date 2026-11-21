/**
 * Validator Pesanan Kasir (Order / Checkout)
 */
const Joi = require('joi');
const { ORDER_TYPES, PAYMENT_METHODS_ORDER } = require('../config/constants');

const orderItemInputSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  quantity: Joi.number().integer().positive().required(),
  notes: Joi.string().max(255).allow(null, '').optional(),
});

const createOrderSchema = Joi.object({
  order_type: Joi.string().valid(...ORDER_TYPES).required(),
  table_number: Joi.string().max(20).allow(null, '').optional(),
  customer_name: Joi.string().max(100).allow(null, '').optional(),
  payment_method: Joi.string().valid(...PAYMENT_METHODS_ORDER).required(),
  discount: Joi.number().min(0).default(0),
  cash_given: Joi.number().min(0).when('payment_method', {
    is: 'cash',
    then: Joi.required().messages({
      'any.required': 'cash_given wajib diisi saat metode pembayaran cash',
    }),
    otherwise: Joi.optional().default(0),
  }),
  items: Joi.array().items(orderItemInputSchema).min(1).required().messages({
    'array.min': 'Pesanan harus berisi minimal 1 produk',
  }),
});

module.exports = {
  createOrderSchema,
};
