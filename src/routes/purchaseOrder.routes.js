/**
 * Routes Pengadaan Bahan Baku (Purchase Order)
 */
const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrder.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize, checkRoute } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createPoSchema,
  payPoSchema,
} = require('../validators/purchaseOrder.validator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Modul purchasing: Finance, Supervisor, Manager
router.use(checkRoute('/purchasing'));

router.get(
  '/',
  authorize(ROLES.MANAGER, ROLES.FINANCE, ROLES.SUPERVISOR),
  purchaseOrderController.getAllPurchaseOrders
);

router.get(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.FINANCE, ROLES.SUPERVISOR),
  purchaseOrderController.getPurchaseOrderById
);

router.post(
  '/',
  authorize(ROLES.MANAGER, ROLES.FINANCE, ROLES.SUPERVISOR),
  validate(createPoSchema),
  purchaseOrderController.createPurchaseOrder
);

router.patch(
  '/:id/pay',
  authorize(ROLES.MANAGER, ROLES.FINANCE),
  validate(payPoSchema),
  purchaseOrderController.payPurchaseOrder
);

router.delete(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.FINANCE),
  purchaseOrderController.deletePurchaseOrder
);

module.exports = router;
