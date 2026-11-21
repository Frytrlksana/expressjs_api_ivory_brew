/**
 * Routes Stok Opname & Audit
 */
const express = require('express');
const router = express.Router();
const stockOpnameController = require('../controllers/stockOpname.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createOpnameSessionSchema,
  updateOpnameScheduleSchema,
} = require('../validators/stockOpname.validator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// 1. Pengingat Jadwal Audit (Harus sebelum /sessions/:id)
router.get(
  '/reminders',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.FINANCE),
  stockOpnameController.getReminders
);

// 2. Konfigurasi Jadwal Audit
router.get(
  '/schedule',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  stockOpnameController.getSchedule
);

router.put(
  '/schedule',
  authorize(ROLES.MANAGER),
  validate(updateOpnameScheduleSchema),
  stockOpnameController.updateSchedule
);

// 3. Sesi Stok Opname
router.get(
  '/sessions',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.FINANCE),
  stockOpnameController.getAllOpnameSessions
);

router.get(
  '/sessions/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.FINANCE),
  stockOpnameController.getOpnameSessionById
);

router.post(
  '/sessions',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  validate(createOpnameSessionSchema),
  stockOpnameController.createOpnameSession
);

module.exports = router;
