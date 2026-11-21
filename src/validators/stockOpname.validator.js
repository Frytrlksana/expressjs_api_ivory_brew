/**
 * Validator Stok Opname (Session & Schedule)
 */
const Joi = require('joi');
const { OPNAME_CADENCE, OPNAME_SCOPES, ITEM_TYPES } = require('../config/constants');

const opnameItemSchema = Joi.object({
  item_id: Joi.string().uuid().required(),
  item_type: Joi.string().valid(...Object.values(ITEM_TYPES)).required(),
  physical_stock: Joi.number().min(0).required(),
  reason: Joi.string().max(30).required(),
  notes: Joi.string().allow(null, '').optional(),
});

const createOpnameSessionSchema = Joi.object({
  cadence: Joi.string().valid(...Object.values(OPNAME_CADENCE)).required(),
  scope: Joi.string().valid(...OPNAME_SCOPES).required(),
  auditor_name: Joi.string().max(100).optional(), // jika tidak dikirim, ambil dari req.user.name
  notes: Joi.string().allow(null, '').optional(),
  items: Joi.array().items(opnameItemSchema).min(1).required().messages({
    'array.min': 'Sesi opname harus menyertakan minimal 1 item untuk diperiksa',
  }),
});

const updateOpnameScheduleSchema = Joi.object({
  primary_cadence: Joi.string().valid(...Object.values(OPNAME_CADENCE)).optional(),
  daily_enabled: Joi.boolean().optional(),
  daily_target_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  weekly_enabled: Joi.boolean().optional(),
  weekly_day: Joi.number().integer().min(0).max(6).optional(),
  monthly_enabled: Joi.boolean().optional(),
  monthly_day: Joi.number().integer().min(1).max(31).optional(),
  monthly_reminder_days: Joi.number().integer().min(1).max(10).optional(),
  default_scope: Joi.string().valid(...OPNAME_SCOPES).optional(),
  default_auto_expense: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createOpnameSessionSchema,
  updateOpnameScheduleSchema,
};
