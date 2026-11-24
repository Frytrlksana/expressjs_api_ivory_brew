/**
 * Routes Data Member (Customer Loyalty)
 */
const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize, checkRoute } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createMemberSchema,
  updateMemberSchema,
  claimRewardSchema,
} = require('../validators/member.validator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// List member & filter
router.get(
  '/',
  authorize(ROLES.MANAGER, ROLES.BARISTA, ROLES.SUPERVISOR, ROLES.FINANCE),
  memberController.getAllMembers
);

// Cari by nomor telepon
router.get(
  '/phone/:phone',
  authorize(ROLES.MANAGER, ROLES.BARISTA, ROLES.SUPERVISOR, ROLES.FINANCE),
  memberController.getMemberByPhone
);

// Detail member by ID
router.get(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.BARISTA, ROLES.SUPERVISOR, ROLES.FINANCE),
  memberController.getMemberById
);

// Tambah member baru
router.post(
  '/',
  authorize(ROLES.MANAGER, ROLES.BARISTA, ROLES.SUPERVISOR),
  validate(createMemberSchema),
  memberController.createMember
);

// Klaim reward (9 stamps -> 1 free cup)
router.post(
  '/claim-reward',
  authorize(ROLES.MANAGER, ROLES.BARISTA, ROLES.SUPERVISOR),
  validate(claimRewardSchema),
  memberController.claimReward
);

// Update member (koreksi nama / stamp manual)
router.put(
  '/:id',
  authorize(ROLES.MANAGER, ROLES.SUPERVISOR),
  validate(updateMemberSchema),
  memberController.updateMember
);

// Hapus member
router.delete(
  '/:id',
  authorize(ROLES.MANAGER),
  memberController.deleteMember
);

module.exports = router;
