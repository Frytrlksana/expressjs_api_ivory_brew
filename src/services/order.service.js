/**
 * Service Transaksi Kasir & Checkout (POS)
 */
const { sequelize } = require('../config/database');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const {
  OrderTransaction,
  OrderItem,
  Product,
  Recipe,
  RecipeItem,
  RawMaterial,
  User,
} = require('../models');
const { generateReceiptNumber } = require('../utils/generators');
const { convertRecipeQuantityToMaterialStock } = require('../utils/unitConversion');
const { getPagination, getPagingData, getOrder, getSearchClause } = require('../utils/pagination');
const { ORDER_STATUS } = require('../config/constants');
const realtime = require('../utils/realtime');

/**
 * Checkout Transaksi Kasir
 */
const checkoutOrder = async (orderData, user) => {
  const result = await sequelize.transaction(async (t) => {
    // 1. Validasi kasir
    const cashierName = user.name;
    const cashierUser = await User.findOne({ where: { name: cashierName }, transaction: t });
    if (!cashierUser) {
      throw new AppError(`Kasir '${cashierName}' tidak valid di sistem.`, 400);
    }

    // 2. Fetch seluruh produk yang dipesan
    const productIds = orderData.items.map((i) => i.product_id);
    const products = await Product.findAll({
      where: { id: productIds },
      include: [
        {
          model: Recipe,
          as: 'recipe',
          include: [
            {
              model: RecipeItem,
              as: 'items',
              include: [
                {
                  model: RawMaterial,
                  as: 'material',
                },
              ],
            },
          ],
        },
      ],
      transaction: t,
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 3. Hitung subtotal dan siapkan order items
    let subtotal = 0;
    const orderItemsToCreate = [];

    // Map untuk akumulasi kebutuhan bahan baku & stok produk
    const materialDeductions = new Map(); // material_id -> { materialInstance, totalQtyNeeded }
    const productDeductions = new Map();  // product_id -> { productInstance, totalQtyNeeded }

    for (const itemInput of orderData.items) {
      const product = productMap.get(itemInput.product_id);
      if (!product) {
        throw new AppError(`Produk dengan ID '${itemInput.product_id}' tidak ditemukan.`, 404);
      }

      const qty = itemInput.quantity;
      const unitPrice = Number(product.price);
      const costPrice = Number(product.cost_price);
      subtotal += unitPrice * qty;

      orderItemsToCreate.push({
        product_id: product.id,
        quantity: qty,
        unit_price: unitPrice,
        cost_price: costPrice,
        notes: itemInput.notes || null,
      });

      // Logika pengurangan stok
      if (product.recipe && product.recipe.items && product.recipe.items.length > 0) {
        for (const rItem of product.recipe.items) {
          const material = rItem.material;
          if (!material) {
            throw new AppError(`Bahan baku untuk resep '${product.name}' tidak ditemukan.`, 500);
          }

          const stockQtyPerUnit = convertRecipeQuantityToMaterialStock(
            rItem.quantity,
            rItem.unit,
            material.unit
          );
          const totalMaterialNeeded = stockQtyPerUnit * qty;

          if (!materialDeductions.has(material.id)) {
            materialDeductions.set(material.id, {
              material,
              needed: 0,
            });
          }
          materialDeductions.get(material.id).needed += totalMaterialNeeded;
        }
      } else {
        // Produk non-resep: kurangi stok fisik produk
        if (!productDeductions.has(product.id)) {
          productDeductions.set(product.id, {
            product,
            needed: 0,
          });
        }
        productDeductions.get(product.id).needed += qty;
      }
    }

    // 4. Validasi kecukupan stok bahan baku
    for (const [matId, entry] of materialDeductions.entries()) {
      const currentStock = Number(entry.material.current_stock);
      if (currentStock < entry.needed) {
        throw new AppError(
          `Stok bahan baku '${entry.material.name}' tidak mencukupi (Tersedia: ${currentStock} ${entry.material.unit}, Dibutuhkan: ${entry.needed.toFixed(2)} ${entry.material.unit}).`,
          400
        );
      }
    }

    // 5. Validasi kecukupan stok produk reguler
    for (const [prodId, entry] of productDeductions.entries()) {
      const currentStock = Number(entry.product.stock);
      if (currentStock < entry.needed) {
        throw new AppError(
          `Stok produk '${entry.product.name}' tidak mencukupi (Tersedia: ${currentStock}, Dibutuhkan: ${entry.needed}).`,
          400
        );
      }
    }

    // 6. Kurangi stok bahan baku aktual
    for (const [matId, entry] of materialDeductions.entries()) {
      entry.material.current_stock = Number(
        (Number(entry.material.current_stock) - entry.needed).toFixed(3)
      );
      await entry.material.save({ transaction: t });
    }

    // 7. Kurangi stok produk reguler aktual
    for (const [prodId, entry] of productDeductions.entries()) {
      entry.product.stock = Number(entry.product.stock) - entry.needed;
      await entry.product.save({ transaction: t });
    }

    // 8. Hitung Pajak & Total
    const discount = Number(orderData.discount || 0);
    const taxableBase = Math.max(0, subtotal - discount);
    const taxRate = config.business.taxRate;
    const tax = Number((taxableBase * taxRate).toFixed(2));
    const total = Number((taxableBase + tax).toFixed(2));

    let cashGiven = Number(orderData.cash_given || 0);
    let change = 0;

    if (orderData.payment_method === 'cash') {
      if (cashGiven < total) {
        throw new AppError(
          `Uang tunai kurang. Total tagihan: Rp ${total.toLocaleString('id-ID')}, Uang diberikan: Rp ${cashGiven.toLocaleString('id-ID')}.`,
          400
        );
      }
      change = Number((cashGiven - total).toFixed(2));
    } else {
      cashGiven = total;
      change = 0;
    }

    // 9. Generate receipt_number
    const receiptNumber = await generateReceiptNumber(OrderTransaction, t);

    // 10. Simpan order transaksi
    const order = await OrderTransaction.create(
      {
        receipt_number: receiptNumber,
        created_at: new Date(),
        cashier_name: cashierName,
        order_type: orderData.order_type,
        table_number: orderData.table_number || null,
        customer_name: orderData.customer_name || null,
        subtotal,
        tax,
        discount,
        total,
        cash_given: cashGiven,
        change,
        payment_method: orderData.payment_method,
        status: ORDER_STATUS.COMPLETED,
      },
      { transaction: t }
    );

    // 11. Simpan order items
    for (const item of orderItemsToCreate) {
      item.order_id = order.id;
    }
    await OrderItem.bulkCreate(orderItemsToCreate, { transaction: t });

    // Kembalikan order lengkap
    return getOrderById(order.id, t);
  });

  realtime.broadcast('order:created', {
    order_id: result.id,
    receipt_number: result.receipt_number,
    total: result.total,
  });

  return result;
};

const getAllOrders = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const order = getOrder(query.sort, [['created_at', 'DESC']]);
  const searchClause = getSearchClause(query.search, [
    'receipt_number',
    'cashier_name',
    'customer_name',
    'table_number',
  ]);

  const whereClause = { ...searchClause };
  if (query.status) {
    whereClause.status = query.status;
  }
  if (query.payment_method) {
    whereClause.payment_method = query.payment_method;
  }
  if (query.order_type) {
    whereClause.order_type = query.order_type;
  }

  const data = await OrderTransaction.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'category', 'image'],
          },
        ],
      },
    ],
    order,
    limit,
    offset,
    distinct: true,
  });

  return getPagingData(data, page, limit);
};

const getOrderById = async (id, transaction = null) => {
  const order = await OrderTransaction.findByPk(id, {
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'category', 'image'],
          },
        ],
      },
    ],
    transaction,
  });

  if (!order) {
    throw new AppError('Transaksi order tidak ditemukan.', 404);
  }

  return order;
};

/**
 * Membatalkan order dan mengembalikan stok
 */
const cancelOrder = async (id) => {
  const result = await sequelize.transaction(async (t) => {
    const order = await OrderTransaction.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: Recipe,
                  as: 'recipe',
                  include: [
                    {
                      model: RecipeItem,
                      as: 'items',
                      include: [
                        {
                          model: RawMaterial,
                          as: 'material',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!order) {
      throw new AppError('Transaksi order tidak ditemukan.', 404);
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      throw new AppError('Transaksi order ini sudah dibatalkan sebelumnya.', 400);
    }

    // Kembalikan stok
    for (const orderItem of order.items) {
      const product = orderItem.product;
      const qty = orderItem.quantity;

      if (product && product.recipe && product.recipe.items && product.recipe.items.length > 0) {
        for (const rItem of product.recipe.items) {
          const material = rItem.material;
          if (material) {
            const stockQtyUsed = convertRecipeQuantityToMaterialStock(
              rItem.quantity,
              rItem.unit,
              material.unit
            );
            const totalToReturn = stockQtyUsed * qty;
            material.current_stock = Number(
              (Number(material.current_stock) + totalToReturn).toFixed(3)
            );
            await material.save({ transaction: t });
          }
        }
      } else if (product) {
        product.stock = Number(product.stock) + qty;
        await product.save({ transaction: t });
      }
    }

    order.status = ORDER_STATUS.CANCELLED;
    await order.save({ transaction: t });

    return getOrderById(order.id, t);
  });

  realtime.broadcast('order:cancelled', {
    order_id: result.id,
    receipt_number: result.receipt_number,
  });

  return result;
};

module.exports = {
  checkoutOrder,
  getAllOrders,
  getOrderById,
  cancelOrder,
};
