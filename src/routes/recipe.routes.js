/**
 * Routes Resep (BOM)
 */
const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createRecipeSchema,
  updateRecipeSchema,
} = require('../validators/recipe.validator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.get(
  '/',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.BARISTA, ROLES.FINANCE),
  recipeController.getAllRecipes
);

router.get(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.BARISTA, ROLES.FINANCE),
  recipeController.getRecipeById
);

// Kelola resep: Manager & Supervisor
router.post(
  '/',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  validate(createRecipeSchema),
  recipeController.createRecipe
);

router.put(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  validate(updateRecipeSchema),
  recipeController.updateRecipe
);

router.post(
  '/:id/recalculate-cost',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.FINANCE),
  recipeController.recalculateCost
);

router.delete(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  recipeController.deleteRecipe
);

module.exports = router;
