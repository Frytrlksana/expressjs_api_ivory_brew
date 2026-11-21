/**
 * Routes Jadwal Shift Barista
 */
const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shift.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createShiftSchema, updateShiftSchema } = require('../validators/shift.validator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Barista, supervisor, dan manager bisa melihat shift
router.get('/', authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.BARISTA), shiftController.getAllShifts);
router.get('/:id', authorize(ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.BARISTA), shiftController.getShiftById);

// Hanya manager dan supervisor yang boleh mengelola shift
router.post(
  '/',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  validate(createShiftSchema),
  shiftController.createShift
);
router.put(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  validate(updateShiftSchema),
  shiftController.updateShift
);
router.delete('/:id', authorize(ROLES.MANAGER, ROLES.SUPERVISOR), shiftController.deleteShift);

module.exports = router;
