/**
 * Validator Produk
 */
const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().max(100).required(),
  category: Joi.string().max(50).required(),
  price: Joi.number().min(0).required(),
  cost_price: Joi.number().min(0).optional(),
  recipe_id: Joi.string().uuid().allow(null, '').optional(),
  image: Joi.string().max(255).allow(null, '').optional(),
  stock: Joi.number().integer().min(0).default(0),
  description: Joi.string().allow(null, '').optional(),
  is_best_seller: Joi.boolean().default(false),
});

const updateProductSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  category: Joi.string().max(50).optional(),
  price: Joi.number().min(0).optional(),
  cost_price: Joi.number().min(0).optional(),
  recipe_id: Joi.string().uuid().allow(null, '').optional(),
  image: Joi.string().max(255).allow(null, '').optional(),
  stock: Joi.number().integer().min(0).optional(),
  description: Joi.string().allow(null, '').optional(),
  is_best_seller: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createProductSchema,
  updateProductSchema,
};
