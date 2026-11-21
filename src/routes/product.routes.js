/**
 * Routes Produk & Menu
 */
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createProductSchema,
  updateProductSchema,
} = require('../validators/product.validator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Barista, finance, supervisor, dan manager bisa melihat menu produk
router.get(
  '/',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.BARISTA, ROLES.FINANCE),
  productController.getAllProducts
);

router.get(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.BARISTA, ROLES.FINANCE),
  productController.getProductById
);

// Tambah / Ubah / Hapus Produk: Manager & Supervisor
router.post(
  '/',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  productController.deleteProduct
);

module.exports = router;
