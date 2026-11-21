/**
 * Service Resep & Bill of Materials (BOM)
 */
const { sequelize } = require('../config/database');
const AppError = require('../utils/AppError');
const { Recipe, RecipeItem, RawMaterial, Product } = require('../models');
const { getPagination, getPagingData, getOrder, getSearchClause } = require('../utils/pagination');
const { convertRecipeQuantityToMaterialStock } = require('../utils/unitConversion');
const realtime = require('../utils/realtime');

/**
 * Menghitung estimasi biaya (HPP) resep berdasarkan item & harga bahan baku
 */
const calculateRecipeCost = (items, rawMaterialsMap) => {
  let totalCost = 0;

  for (const item of items) {
    const material = rawMaterialsMap.get(item.material_id);
    if (!material) {
      throw new AppError(`Bahan baku ID '${item.material_id}' tidak ditemukan.`, 404);
    }

    const stockQtyUsed = convertRecipeQuantityToMaterialStock(
      item.quantity,
      item.unit,
      material.unit
    );
    const itemCost = stockQtyUsed * Number(material.unit_price);
    totalCost += itemCost;
  }

  return Number(totalCost.toFixed(2));
};

const getAllRecipes = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const order = getOrder(query.sort, [['name', 'ASC']]);
  const searchClause = getSearchClause(query.search, ['name', 'category', 'description']);

  const whereClause = { ...searchClause };
  if (query.category) {
    whereClause.category = query.category;
  }

  const data = await Recipe.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: RecipeItem,
        as: 'items',
        include: [
          {
            model: RawMaterial,
            as: 'material',
            attributes: ['id', 'name', 'unit', 'unit_price', 'current_stock'],
          },
        ],
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'cost_price'],
      },
    ],
    order,
    limit,
    offset,
    distinct: true,
  });

  return getPagingData(data, page, limit);
};

const getRecipeById = async (id) => {
  const recipe = await Recipe.findByPk(id, {
    include: [
      {
        model: RecipeItem,
        as: 'items',
        include: [
          {
            model: RawMaterial,
            as: 'material',
            attributes: ['id', 'name', 'unit', 'unit_price', 'current_stock'],
          },
        ],
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'cost_price'],
      },
    ],
  });

  if (!recipe) {
    throw new AppError('Resep tidak ditemukan.', 404);
  }

  return recipe;
};

const createRecipe = async (recipeData) => {
  return sequelize.transaction(async (t) => {
    // Kumpulkan seluruh ID material untuk di-fetch
    const materialIds = recipeData.items.map((i) => i.material_id);
    const materials = await RawMaterial.findAll({
      where: { id: materialIds },
      transaction: t,
    });
    const materialsMap = new Map(materials.map((m) => [m.id, m]));

    const estimatedCost = calculateRecipeCost(recipeData.items, materialsMap);

    const recipe = await Recipe.create(
      {
        name: recipeData.name,
        category: recipeData.category,
        description: recipeData.description,
        serving_size: recipeData.serving_size,
        estimated_cost: estimatedCost,
        updated_at: new Date(),
      },
      { transaction: t }
    );

    const itemsToCreate = recipeData.items.map((item) => ({
      recipe_id: recipe.id,
      material_id: item.material_id,
      quantity: item.quantity,
      unit: item.unit,
    }));

    await RecipeItem.bulkCreate(itemsToCreate, { transaction: t });

    const created = await getRecipeById(recipe.id);
    realtime.broadcast('recipe:created', { id: recipe.id, name: recipe.name });
    return created;
  });
};

const updateRecipe = async (id, updateData) => {
  const result = await sequelize.transaction(async (t) => {
    const recipe = await Recipe.findByPk(id, { transaction: t });
    if (!recipe) {
      throw new AppError('Resep tidak ditemukan.', 404);
    }

    if (updateData.items && Array.isArray(updateData.items)) {
      const materialIds = updateData.items.map((i) => i.material_id);
      const materials = await RawMaterial.findAll({
        where: { id: materialIds },
        transaction: t,
      });
      const materialsMap = new Map(materials.map((m) => [m.id, m]));

      const estimatedCost = calculateRecipeCost(updateData.items, materialsMap);
      recipe.estimated_cost = estimatedCost;

      // Replace items
      await RecipeItem.destroy({ where: { recipe_id: id }, transaction: t });

      const itemsToCreate = updateData.items.map((item) => ({
        recipe_id: id,
        material_id: item.material_id,
        quantity: item.quantity,
        unit: item.unit,
      }));

      await RecipeItem.bulkCreate(itemsToCreate, { transaction: t });

      // Sinkronkan cost_price produk yang terhubung
      await Product.update(
        { cost_price: estimatedCost },
        { where: { recipe_id: id }, transaction: t }
      );
    }

    if (updateData.name) recipe.name = updateData.name;
    if (updateData.category) recipe.category = updateData.category;
    if (updateData.description !== undefined) recipe.description = updateData.description;
    if (updateData.serving_size !== undefined) recipe.serving_size = updateData.serving_size;

    recipe.updated_at = new Date();
    await recipe.save({ transaction: t });

    return getRecipeById(id);
  });

  realtime.broadcast('recipe:updated', { id, name: result.name });
  return result;
};

const recalculateCost = async (id) => {
  const result = await sequelize.transaction(async (t) => {
    const recipe = await Recipe.findByPk(id, {
      include: [{ model: RecipeItem, as: 'items' }],
      transaction: t,
    });

    if (!recipe) {
      throw new AppError('Resep tidak ditemukan.', 404);
    }

    const materialIds = recipe.items.map((i) => i.material_id);
    const materials = await RawMaterial.findAll({
      where: { id: materialIds },
      transaction: t,
    });
    const materialsMap = new Map(materials.map((m) => [m.id, m]));

    const estimatedCost = calculateRecipeCost(recipe.items, materialsMap);
    recipe.estimated_cost = estimatedCost;
    recipe.updated_at = new Date();
    await recipe.save({ transaction: t });

    // Sinkronkan products.cost_price
    await Product.update(
      { cost_price: estimatedCost },
      { where: { recipe_id: id }, transaction: t }
    );

    return getRecipeById(id);
  });

  realtime.broadcast('recipe:updated', { id, name: result.name });
  return result;
};

const deleteRecipe = async (id) => {
  const recipe = await Recipe.findByPk(id);
  if (!recipe) {
    throw new AppError('Resep tidak ditemukan.', 404);
  }

  // Cek produk yang masih menggunakan resep ini
  const productCount = await Product.count({ where: { recipe_id: id } });
  if (productCount > 0) {
    throw new AppError(
      `Resep tidak dapat dihapus karena masih digunakan oleh ${productCount} produk. Lepaskan relasi produk terlebih dahulu.`,
      400
    );
  }

  await sequelize.transaction(async (t) => {
    await RecipeItem.destroy({ where: { recipe_id: id }, transaction: t });
    await recipe.destroy({ transaction: t });
  });

  realtime.broadcast('recipe:deleted', { id });
  return { id };
};

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  recalculateCost,
  deleteRecipe,
};
