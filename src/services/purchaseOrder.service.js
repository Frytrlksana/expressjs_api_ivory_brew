/**
 * Service Pengadaan Bahan Baku (Purchase Order)
 */
const { sequelize } = require('../config/database');
const AppError = require('../utils/AppError');
const {
  PurchaseOrder,
  PurchaseOrderItem,
  RawMaterial,
  Expense,
} = require('../models');
const { generatePoNumber } = require('../utils/generators');
const { convertRecipeQuantityToMaterialStock } = require('../utils/unitConversion');
const { getPagination, getPagingData, getOrder, getSearchClause } = require('../utils/pagination');
const { PO_STATUS } = require('../config/constants');
const realtime = require('../utils/realtime');

const getAllPurchaseOrders = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const order = getOrder(query.sort, [['date', 'DESC']]);
  const searchClause = getSearchClause(query.search, ['po_number', 'supplier', 'notes']);

  const whereClause = { ...searchClause };
  if (query.status) {
    whereClause.status = query.status;
  }
  if (query.payment_method) {
    whereClause.payment_method = query.payment_method;
  }

  const data = await PurchaseOrder.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: PurchaseOrderItem,
        as: 'items',
        include: [
          {
            model: RawMaterial,
            as: 'material',
            attributes: ['id', 'name', 'unit', 'current_stock'],
          },
        ],
      },
      {
        model: Expense,
        as: 'expense',
      },
    ],
    order,
    limit,
    offset,
    distinct: true,
  });

  return getPagingData(data, page, limit);
};

const getPurchaseOrderById = async (id, transaction = null) => {
  const po = await PurchaseOrder.findByPk(id, {
    include: [
      {
        model: PurchaseOrderItem,
        as: 'items',
        include: [
          {
            model: RawMaterial,
            as: 'material',
            attributes: ['id', 'name', 'unit', 'current_stock'],
          },
        ],
      },
      {
        model: Expense,
        as: 'expense',
      },
    ],
    transaction,
  });

  if (!po) {
    throw new AppError('Purchase order tidak ditemukan.', 404);
  }

  return po;
};

const createPurchaseOrder = async (poData) => {
  return sequelize.transaction(async (t) => {
    // 1. Fetch bahan baku terkait
    const materialIds = poData.items.map((i) => i.material_id);
    const materials = await RawMaterial.findAll({
      where: { id: materialIds },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    const materialMap = new Map(materials.map((m) => [m.id, m]));

    // 2. Hitung total per item dan total cost PO
    let totalCost = 0;
    const itemsToCreate = [];

    for (const item of poData.items) {
      const material = materialMap.get(item.material_id);
      if (!material) {
        throw new AppError(`Bahan baku ID '${item.material_id}' tidak ditemukan.`, 404);
      }

      const qty = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const itemTotal = Number((qty * unitPrice).toFixed(2));
      totalCost += itemTotal;

      itemsToCreate.push({
        material_id: item.material_id,
        quantity: qty,
        unit: item.unit,
        unit_price: unitPrice,
        total: itemTotal,
      });

      // Tambah stok bahan baku (dengan konversi jika unit beli beda dengan unit stok)
      const qtyInStockUnit = convertRecipeQuantityToMaterialStock(
        qty,
        item.unit,
        material.unit
      );
      material.current_stock = Number(
        (Number(material.current_stock) + qtyInStockUnit).toFixed(3)
      );

      // Perbarui unit_price bahan baku (harga beli terakhir per satuan stok)
      const pricePerStockUnit = qtyInStockUnit > 0 ? itemTotal / qtyInStockUnit : unitPrice;
      material.unit_price = Number(pricePerStockUnit.toFixed(2));
      await material.save({ transaction: t });
    }

    // 3. Generate po_number (PO-IBC-YYYYMM-XX)
    const poNumber = await generatePoNumber(PurchaseOrder, t);

    // 4. Buat Purchase Order
    const po = await PurchaseOrder.create(
      {
        po_number: poNumber,
        supplier: poData.supplier,
        date: poData.date,
        total_cost: Number(totalCost.toFixed(2)),
        status: poData.status,
        payment_method: poData.payment_method,
        due_date: poData.status === PO_STATUS.TEMPO ? poData.due_date : null,
        notes: poData.notes || null,
      },
      { transaction: t }
    );

    // 5. Simpan items PO
    for (const item of itemsToCreate) {
      item.po_id = po.id;
    }
    await PurchaseOrderItem.bulkCreate(itemsToCreate, { transaction: t });

    // 6. Jika lunas, otomatis buat Expense
    if (po.status === PO_STATUS.LUNAS) {
      await Expense.create(
        {
          date: po.date,
          category: 'bahan-baku',
          amount: po.total_cost,
          description: `Pengadaan Bahan Baku PO ${po.po_number} (${po.supplier})`,
          payment_method: po.payment_method,
          reference_po_id: po.id,
        },
        { transaction: t }
      );
    }

    const created = await getPurchaseOrderById(po.id, t);
    return created;
  });

  realtime.broadcast('po:created', { id: result.id, po_number: result.po_number });
  realtime.broadcast('raw-material:updated', {});
  if (result.status === PO_STATUS.LUNAS) {
    realtime.broadcast('expense:created', {});
  }
  return result;
};

/**
 * Membayar PO yang berstatus tempo
 */
const payPurchaseOrder = async (id, paymentData = {}) => {
  const result = await sequelize.transaction(async (t) => {
    const po = await PurchaseOrder.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!po) {
      throw new AppError('Purchase order tidak ditemukan.', 404);
    }

    if (po.status === PO_STATUS.LUNAS) {
      throw new AppError('Purchase order ini sudah berstatus lunas.', 400);
    }

    const paymentMethod = paymentData.payment_method || po.payment_method;

    po.status = PO_STATUS.LUNAS;
    po.payment_method = paymentMethod;
    await po.save({ transaction: t });

    // Buat expense pengadaan
    await Expense.create(
      {
        date: new Date().toISOString().split('T')[0],
        category: 'bahan-baku',
        amount: po.total_cost,
        description: `Pelunasan Pengadaan PO ${po.po_number} (${po.supplier})`,
        payment_method: paymentMethod,
        reference_po_id: po.id,
      },
      { transaction: t }
    );

    return getPurchaseOrderById(po.id, t);
  });

  realtime.broadcast('po:updated', { id: result.id, status: result.status });
  realtime.broadcast('expense:created', {});
  return result;
};

const deletePurchaseOrder = async (id) => {
  const po = await PurchaseOrder.findByPk(id);
  if (!po) {
    throw new AppError('Purchase order tidak ditemukan.', 404);
  }

  if (po.status === PO_STATUS.LUNAS) {
    throw new AppError(
      'Purchase order yang sudah lunas dan terhubung dengan laporan pengeluaran tidak dapat dihapus.',
      400
    );
  }

  await sequelize.transaction(async (t) => {
    await PurchaseOrderItem.destroy({ where: { po_id: id }, transaction: t });
    await po.destroy({ transaction: t });
  });

  realtime.broadcast('po:deleted', { id });
  return { id };
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  payPurchaseOrder,
  deletePurchaseOrder,
};
