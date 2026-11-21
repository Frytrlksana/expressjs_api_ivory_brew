/**
 * Routes Manajemen Pengguna
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize, checkRoute } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createUserSchema, updateUserSchema } = require('../validators/user.validator');
const { ROLES } = require('../config/constants');

// Semua rute pengguna membutuhkan login dan permission /settings (atau role manager)
router.use(authenticate);
router.use(checkRoute('/settings'));

router.get('/', authorize(ROLES.MANAGER), userController.getAllUsers);
router.get('/:id', authorize(ROLES.MANAGER), userController.getUserById);
router.post('/', authorize(ROLES.MANAGER), validate(createUserSchema), userController.createUser);
router.put('/:id', authorize(ROLES.MANAGER), validate(updateUserSchema), userController.updateUser);
router.patch('/:id/toggle-active', authorize(ROLES.MANAGER), userController.toggleUserActive);
router.delete('/:id', authorize(ROLES.MANAGER), userController.deleteUser);

module.exports = router;
