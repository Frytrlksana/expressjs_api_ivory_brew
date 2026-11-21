/**
 * Validator Shift Barista
 */
const Joi = require('joi');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // format HH:MM

const createShiftSchema = Joi.object({
  name: Joi.string().max(100).required(),
  start_time: Joi.string().pattern(timeRegex).required().messages({
    'string.pattern.base': 'start_time harus berformat HH:MM (contoh: 08:00)',
  }),
  end_time: Joi.string().pattern(timeRegex).required().messages({
    'string.pattern.base': 'end_time harus berformat HH:MM (contoh: 16:00)',
  }),
  barista_name: Joi.string().max(100).required(),
  station: Joi.string().max(100).allow(null, '').optional(),
  days_active: Joi.string().max(100).required(),
  is_active: Joi.boolean().default(true),
  notes: Joi.string().allow(null, '').optional(),
});

const updateShiftSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  start_time: Joi.string().pattern(timeRegex).optional(),
  end_time: Joi.string().pattern(timeRegex).optional(),
  barista_name: Joi.string().max(100).optional(),
  station: Joi.string().max(100).allow(null, '').optional(),
  days_active: Joi.string().max(100).optional(),
  is_active: Joi.boolean().optional(),
  notes: Joi.string().allow(null, '').optional(),
}).min(1);

module.exports = {
  createShiftSchema,
  updateShiftSchema,
};
