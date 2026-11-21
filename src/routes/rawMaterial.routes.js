/**
 * Routes Bahan Baku (Raw Material)
 */
const express = require('express');
const router = express.Router();
const rawMaterialController = require('../controllers/rawMaterial.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createRawMaterialSchema,
  updateRawMaterialSchema,
} = require('../validators/rawMaterial.validator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Low-stock harus didaftarkan sebelum /:id
router.get(
  '/low-stock',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.FINANCE, ROLES.BARISTA),
  rawMaterialController.getLowStockMaterials
);

router.get(
  '/',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.FINANCE, ROLES.BARISTA),
  rawMaterialController.getAllRawMaterials
);

router.get(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.FINANCE, ROLES.BARISTA),
  rawMaterialController.getRawMaterialById
);

// Pengelolaan bahan baku: Manager, Supervisor, Finance
router.post(
  '/',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.FINANCE),
  validate(createRawMaterialSchema),
  rawMaterialController.createRawMaterial
);

router.put(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.FINANCE),
  validate(updateRawMaterialSchema),
  rawMaterialController.updateRawMaterial
);

router.delete(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  rawMaterialController.deleteRawMaterial
);

module.exports = router;
