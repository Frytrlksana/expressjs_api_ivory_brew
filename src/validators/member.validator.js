/**
 * Validator Data Member (Customer Loyalty)
 */
const Joi = require('joi');

const createMemberSchema = Joi.object({
  phone: Joi.string()
    .trim()
    .min(8)
    .max(20)
    .pattern(/^[0-9+]+$/)
    .required()
    .messages({
      'string.empty': 'Nomor WhatsApp wajib diisi',
      'string.pattern.base': 'Nomor WhatsApp hanya boleh berisi angka dan tanda +',
    }),
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Nama pelanggan wajib diisi',
  }),
  stamps: Joi.number().integer().min(0).max(9).default(0),
});

const updateMemberSchema = Joi.object({
  phone: Joi.string()
    .trim()
    .min(8)
    .max(20)
    .pattern(/^[0-9+]+$/)
    .optional(),
  name: Joi.string().trim().min(2).max(100).optional(),
  stamps: Joi.number().integer().min(0).max(9).optional(),
  total_cups_purchased: Joi.number().integer().min(0).optional(),
  stamps_claimed: Joi.number().integer().min(0).optional(),
});

const claimRewardSchema = Joi.object({
  phone: Joi.string().trim().required().messages({
    'string.empty': 'Nomor WhatsApp member wajib diisi',
  }),
});

module.exports = {
  createMemberSchema,
  updateMemberSchema,
  claimRewardSchema,
};
