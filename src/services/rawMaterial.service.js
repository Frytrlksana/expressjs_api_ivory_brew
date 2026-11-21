/**
 * Service Bahan Baku (Raw Material)
 */
const { Op, col } = require('sequelize');
const { sequelize } = require('../config/database');
const AppError = require('../utils/AppError');
const { RawMaterial, RecipeItem, PurchaseOrderItem } = require('../models');
const { getPagination, getPagingData, getOrder, getSearchClause } = require('../utils/pagination');
const realtime = require('../utils/realtime');

const getAllRawMaterials = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const order = getOrder(query.sort, [['name', 'ASC']]);
  const searchClause = getSearchClause(query.search, ['name', 'category', 'supplier']);

  const whereClause = { ...searchClause };
  if (query.category) {
    whereClause.category = query.category;
  }

  const data = await RawMaterial.findAndCountAll({
    where: whereClause,
    order,
    limit,
    offset,
  });

  return getPagingData(data, page, limit);
};

const getLowStockMaterials = async () => {
  const materials = await RawMaterial.findAll({
    where: {
      current_stock: {
        [Op.lte]: col('min_stock_alert'),
      },
    },
    order: [['current_stock', 'ASC']],
  });

  return materials;
};

const getRawMaterialById = async (id) => {
  const material = await RawMaterial.findByPk(id);
  if (!material) {
    throw new AppError('Bahan baku tidak ditemukan.', 404);
  }
  return material;
};

const createRawMaterial = async (data) => {
  const created = await RawMaterial.create(data);
  realtime.broadcast('raw-material:created', { id: created.id, name: created.name });
  return created;
};

const updateRawMaterial = async (id, updateData) => {
  const material = await RawMaterial.findByPk(id);
  if (!material) {
    throw new AppError('Bahan baku tidak ditemukan.', 404);
  }

  Object.assign(material, updateData);
  await material.save();

  realtime.broadcast('raw-material:updated', { id: material.id, name: material.name });
  return material;
};

const deleteRawMaterial = async (id) => {
  const material = await RawMaterial.findByPk(id);
  if (!material) {
    throw new AppError('Bahan baku tidak ditemukan.', 404);
  }

  // Cek relasi ke resep
  const recipeItemCount = await RecipeItem.count({ where: { material_id: id } });
  if (recipeItemCount > 0) {
    throw new AppError(
      `Bahan baku tidak dapat dihapus karena masih digunakan di ${recipeItemCount} resep minuman.`,
      400
    );
  }

  // Cek relasi ke Purchase Order
  const poItemCount = await PurchaseOrderItem.count({ where: { material_id: id } });
  if (poItemCount > 0) {
    throw new AppError(
      `Bahan baku tidak dapat dihapus karena tercatat dalam ${poItemCount} riwayat Purchase Order.`,
      400
    );
  }

  await material.destroy();
  realtime.broadcast('raw-material:deleted', { id });
  return { id };
};

module.exports = {
  getAllRawMaterials,
  getLowStockMaterials,
  getRawMaterialById,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
};
