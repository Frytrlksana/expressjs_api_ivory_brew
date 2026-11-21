/**
 * Routes Transaksi Kasir (Orders)
 */
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize, checkRoute } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createOrderSchema } = require('../validators/order.validator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Kasir POS: Barista, Supervisor, Manager
router.post(
  '/',
  authorize(ROLES.MANAGER, ROLES.BARISTA, ROLES.SUPERVISOR),
  checkRoute('/pos'),
  validate(createOrderSchema),
  orderController.checkoutOrder
);

router.get(
  '/',
  authorize(ROLES.MANAGER, ROLES.BARISTA, ROLES.SUPERVISOR, ROLES.FINANCE),
  orderController.getAllOrders
);

router.get(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.BARISTA, ROLES.SUPERVISOR, ROLES.FINANCE),
  orderController.getOrderById
);

// Pembatalan order: Barista, Supervisor, Manager
router.patch(
  '/:id/cancel',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.BARISTA),
  orderController.cancelOrder
);

module.exports = router;
