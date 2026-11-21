/**
 * Controller Resep Minuman (BOM)
 */
const recipeService = require('../services/recipe.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getAllRecipes = asyncHandler(async (req, res) => {
  const { rows, meta } = await recipeService.getAllRecipes(req.query);
  return successResponse(res, 'Daftar resep berhasil diambil', rows, 200, meta);
});

const getRecipeById = asyncHandler(async (req, res) => {
  const recipe = await recipeService.getRecipeById(req.params.id);
  return successResponse(res, 'Detail resep berhasil diambil', recipe, 200);
});

const createRecipe = asyncHandler(async (req, res) => {
  const recipe = await recipeService.createRecipe(req.body);
  return successResponse(res, 'Resep baru berhasil dibuat', recipe, 201);
});

const updateRecipe = asyncHandler(async (req, res) => {
  const recipe = await recipeService.updateRecipe(req.params.id, req.body);
  return successResponse(res, 'Resep berhasil diperbarui', recipe, 200);
});

const recalculateCost = asyncHandler(async (req, res) => {
  const recipe = await recipeService.recalculateCost(req.params.id);
  return successResponse(res, 'Estimasi biaya resep berhasil dihitung ulang', recipe, 200);
});

const deleteRecipe = asyncHandler(async (req, res) => {
  const result = await recipeService.deleteRecipe(req.params.id);
  return successResponse(res, 'Resep berhasil dihapus', result, 200);
});

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  recalculateCost,
  deleteRecipe,
};
