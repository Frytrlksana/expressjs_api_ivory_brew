/**
 * Validator Resep & Item Resep (BOM)
 */
const Joi = require('joi');

const recipeItemSchema = Joi.object({
  material_id: Joi.string().uuid().required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().max(20).required(),
});

const createRecipeSchema = Joi.object({
  name: Joi.string().max(100).required(),
  category: Joi.string().max(50).required(),
  description: Joi.string().allow(null, '').optional(),
  serving_size: Joi.string().max(50).allow(null, '').optional(),
  items: Joi.array().items(recipeItemSchema).min(1).required().messages({
    'array.min': 'Resep harus memiliki minimal 1 item bahan baku',
  }),
});

const updateRecipeSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  category: Joi.string().max(50).optional(),
  description: Joi.string().allow(null, '').optional(),
  serving_size: Joi.string().max(50).allow(null, '').optional(),
  items: Joi.array().items(recipeItemSchema).min(1).optional(),
}).min(1);

module.exports = {
  createRecipeSchema,
  updateRecipeSchema,
};
