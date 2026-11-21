/**
 * Service Produk & Menu Kafe
 */
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const { Product, Recipe, OrderItem } = require('../models');
const { getPagination, getPagingData, getOrder, getSearchClause } = require('../utils/pagination');
const realtime = require('../utils/realtime');

const getAllProducts = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const order = getOrder(query.sort, [['name', 'ASC']]);
  const searchClause = getSearchClause(query.search, ['name', 'category', 'description']);

  const whereClause = { ...searchClause };
  if (query.category) {
    whereClause.category = query.category;
  }
  if (query.is_best_seller !== undefined) {
    whereClause.is_best_seller = query.is_best_seller === 'true' || query.is_best_seller === true;
  }

  const data = await Product.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Recipe,
        as: 'recipe',
        attributes: ['id', 'name', 'estimated_cost', 'serving_size'],
      },
    ],
    order,
    limit,
    offset,
  });

  return getPagingData(data, page, limit);
};

const getProductById = async (id) => {
  const product = await Product.findByPk(id, {
    include: [
      {
        model: Recipe,
        as: 'recipe',
      },
    ],
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan.', 404);
  }

  return product;
};

const createProduct = async (productData) => {
  let costPrice = productData.cost_price || 0;

  if (productData.recipe_id) {
    const recipe = await Recipe.findByPk(productData.recipe_id);
    if (!recipe) {
      throw new AppError(`Resep ID '${productData.recipe_id}' tidak ditemukan.`, 404);
    }
    // Sinkronkan cost_price dengan estimated_cost resep
    costPrice = recipe.estimated_cost;
  }

  const newProduct = await Product.create({
    ...productData,
    cost_price: costPrice,
  });

  const created = await getProductById(newProduct.id);
  realtime.broadcast('product:created', { id: created.id, name: created.name });
  return created;
};

const updateProduct = async (id, updateData) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError('Produk tidak ditemukan.', 404);
  }

  if (updateData.recipe_id !== undefined && updateData.recipe_id !== null) {
    const recipe = await Recipe.findByPk(updateData.recipe_id);
    if (!recipe) {
      throw new AppError(`Resep ID '${updateData.recipe_id}' tidak ditemukan.`, 404);
    }
    updateData.cost_price = recipe.estimated_cost;
  }

  Object.assign(product, updateData);
  await product.save();

  const updated = await getProductById(id);
  realtime.broadcast('product:updated', { id: updated.id, name: updated.name });
  return updated;
};

const deleteProduct = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError('Produk tidak ditemukan.', 404);
  }

  const orderItemCount = await OrderItem.count({ where: { product_id: id } });
  if (orderItemCount > 0) {
    throw new AppError(
      `Produk tidak dapat dihapus karena tercatat dalam ${orderItemCount} transaksi order kasir.`,
      400
    );
  }

  await product.destroy();
  realtime.broadcast('product:deleted', { id });
  return { id };
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
