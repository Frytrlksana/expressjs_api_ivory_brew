/**
 * Service Role & Menu Permissions
 */
const { sequelize } = require('../config/database');
const AppError = require('../utils/AppError');
const { Role, RoleMenuPermission, User } = require('../models');
const realtime = require('../utils/realtime');

const getAllRoles = async () => {
  return Role.findAll({
    include: [
      {
        model: RoleMenuPermission,
        as: 'permissions',
        attributes: ['id', 'allowed_route'],
      },
    ],
    order: [['name', 'ASC']],
  });
};

const getRoleByCode = async (code) => {
  const role = await Role.findOne({
    where: { code },
    include: [
      {
        model: RoleMenuPermission,
        as: 'permissions',
        attributes: ['id', 'allowed_route'],
      },
    ],
  });

  if (!role) {
    throw new AppError(`Role dengan kode '${code}' tidak ditemukan.`, 404);
  }

  return role;
};

const createRole = async (roleData) => {
  const existingRole = await Role.findOne({ where: { code: roleData.code } });
  if (existingRole) {
    throw new AppError(`Role dengan kode '${roleData.code}' sudah terdaftar.`, 409);
  }

  return sequelize.transaction(async (t) => {
    const role = await Role.create(
      {
        code: roleData.code,
        name: roleData.name,
        description: roleData.description,
        badge_color: roleData.badge_color || 'blue',
        is_default: roleData.is_default || false,
      },
      { transaction: t }
    );

    if (roleData.permissions && Array.isArray(roleData.permissions)) {
      const perms = roleData.permissions.map((route) => ({
        role_code: role.code,
        allowed_route: route,
      }));
      await RoleMenuPermission.bulkCreate(perms, { transaction: t });
    }

    const created = await getRoleByCode(role.code);
    realtime.broadcast('role:created', { code: role.code });
    return created;
  });
};

const updateRole = async (code, updateData) => {
  const role = await Role.findOne({ where: { code } });
  if (!role) {
    throw new AppError(`Role dengan kode '${code}' tidak ditemukan.`, 404);
  }

  Object.assign(role, updateData);
  await role.save();

  const updated = await getRoleByCode(code);
  realtime.broadcast('role:updated', { code });
  return updated;
};

const deleteRole = async (code) => {
  const role = await Role.findOne({ where: { code } });
  if (!role) {
    throw new AppError(`Role dengan kode '${code}' tidak ditemukan.`, 404);
  }

  // Aturan bisnis: Role dengan is_default = true tidak boleh dihapus
  if (role.is_default) {
    throw new AppError(`Role default '${role.name}' tidak dapat dihapus.`, 400);
  }

  // Cek apakah ada pengguna yang menggunakannya
  const userCount = await User.count({ where: { role_code: code } });
  if (userCount > 0) {
    throw new AppError(
      `Role '${role.name}' tidak dapat dihapus karena masih digunakan oleh ${userCount} pengguna.`,
      400
    );
  }

  const result = await sequelize.transaction(async (t) => {
    await RoleMenuPermission.destroy({ where: { role_code: code }, transaction: t });
    await role.destroy({ transaction: t });
    return { code };
  });

  realtime.broadcast('role:deleted', { code });
  return result;
};

const getRolePermissions = async (code) => {
  const role = await Role.findOne({ where: { code } });
  if (!role) {
    throw new AppError(`Role dengan kode '${code}' tidak ditemukan.`, 404);
  }

  const permissions = await RoleMenuPermission.findAll({
    where: { role_code: code },
    attributes: ['allowed_route'],
  });

  return permissions.map((p) => p.allowed_route);
};

const updateRolePermissions = async (code, permissions) => {
  const role = await Role.findOne({ where: { code } });
  if (!role) {
    throw new AppError(`Role dengan kode '${code}' tidak ditemukan.`, 404);
  }

  const result = await sequelize.transaction(async (t) => {
    // Replace seluruh daftar allowed_route
    await RoleMenuPermission.destroy({ where: { role_code: code }, transaction: t });

    if (permissions && permissions.length > 0) {
      const records = permissions.map((route) => ({
        role_code: code,
        allowed_route: route,
      }));
      await RoleMenuPermission.bulkCreate(records, { transaction: t });
    }

    return getRolePermissions(code);
  });

  realtime.broadcast('permission:updated', { role_code: code, permissions });
  return result;
};

module.exports = {
  getAllRoles,
  getRoleByCode,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
};
