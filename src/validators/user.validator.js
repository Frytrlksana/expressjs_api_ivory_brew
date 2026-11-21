/**
 * Validator Pengguna (Users)
 */
const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().max(100).required(),
  password: Joi.string().min(6).required(),
  role_code: Joi.string().max(30).required(),
  station: Joi.string().max(100).allow(null, '').optional(),
  avatar: Joi.string().max(255).allow(null, '').optional(),
  is_active: Joi.boolean().default(true),
});

const updateUserSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  email: Joi.string().email().max(100).optional(),
  password: Joi.string().min(6).optional(),
  role_code: Joi.string().max(30).optional(),
  station: Joi.string().max(100).allow(null, '').optional(),
  avatar: Joi.string().max(255).allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createUserSchema,
  updateUserSchema,
};
