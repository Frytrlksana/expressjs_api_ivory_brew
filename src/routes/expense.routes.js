/**
 * Routes Beban & Biaya Operasional (Expenses)
 */
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize, checkRoute } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createExpenseSchema,
  updateExpenseSchema,
} = require('../validators/expense.validator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Modul finance: Finance, Manager
router.use(checkRoute('/finance'));

router.get(
  '/',
  authorize(ROLES.MANAGER, ROLES.FINANCE),
  expenseController.getAllExpenses
);

router.get(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.FINANCE),
  expenseController.getExpenseById
);

router.post(
  '/',
  authorize(ROLES.MANAGER, ROLES.FINANCE),
  validate(createExpenseSchema),
  expenseController.createExpense
);

router.put(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.FINANCE),
  validate(updateExpenseSchema),
  expenseController.updateExpense
);

router.delete(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.FINANCE),
  expenseController.deleteExpense
);

module.exports = router;
