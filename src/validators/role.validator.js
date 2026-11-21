/**
 * Validator Role & Izin Menu
 */
const Joi = require('joi');
const { ALLOWED_ROUTES } = require('../config/constants');

const createRoleSchema = Joi.object({
  code: Joi.string().alphanum().max(30).required(),
  name: Joi.string().max(100).required(),
  description: Joi.string().allow(null, '').optional(),
  badge_color: Joi.string().max(20).default('blue'),
  is_default: Joi.boolean().default(false),
  permissions: Joi.array().items(Joi.string().valid(...ALLOWED_ROUTES)).optional(),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  description: Joi.string().allow(null, '').optional(),
  badge_color: Joi.string().max(20).optional(),
  is_default: Joi.boolean().optional(),
}).min(1);

const updatePermissionsSchema = Joi.object({
  permissions: Joi.array().items(Joi.string().valid(...ALLOWED_ROUTES)).required().messages({
    'any.required': 'Daftar permissions wajib dikirim (bisa array kosong)',
  }),
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  updatePermissionsSchema,
};
