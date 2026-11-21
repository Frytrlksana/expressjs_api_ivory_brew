/**
 * Routes Laporan Finansial & Operasional (Reports - Read Only)
 */
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize, checkRoute } = require('../middlewares/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Laporan keuangan & penjualan: Manager & Finance
router.get(
  '/sales-summary',
  authorize(ROLES.MANAGER, ROLES.FINANCE),
  reportController.getSalesSummary
);

router.get(
  '/best-sellers',
  authorize(ROLES.MANAGER, ROLES.FINANCE, ROLES.SUPERVISOR),
  reportController.getBestSellers
);

router.get(
  '/profit-loss',
  authorize(ROLES.MANAGER, ROLES.FINANCE),
  reportController.getProfitLoss
);

router.get(
  '/cashflow',
  authorize(ROLES.MANAGER, ROLES.FINANCE),
  reportController.getCashflow
);

module.exports = router;
