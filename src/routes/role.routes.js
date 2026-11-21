/**
 * Routes Role & Permissions
 */
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize, checkRoute } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createRoleSchema,
  updateRoleSchema,
  updatePermissionsSchema,
} = require('../validators/role.validator');
const { ROLES } = require('../config/constants');

router.use(authenticate);
router.use(checkRoute('/settings'));

router.get('/', authorize(ROLES.MANAGER), roleController.getAllRoles);
router.get('/:code', authorize(ROLES.MANAGER), roleController.getRoleByCode);
router.post('/', authorize(ROLES.MANAGER), validate(createRoleSchema), roleController.createRole);
router.put('/:code', authorize(ROLES.MANAGER), validate(updateRoleSchema), roleController.updateRole);
router.delete('/:code', authorize(ROLES.MANAGER), roleController.deleteRole);

// Menu Permissions per Role
router.get('/:code/permissions', authorize(ROLES.MANAGER), roleController.getRolePermissions);
router.put(
  '/:code/permissions',
  authorize(ROLES.MANAGER),
  validate(updatePermissionsSchema),
  roleController.updateRolePermissions
);

module.exports = router;
