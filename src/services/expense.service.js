/**
 * Service Beban & Pengeluaran Keuangan (Expenses)
 */
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const { Expense, PurchaseOrder, StockOpnameSession } = require('../models');
const { getPagination, getPagingData, getOrder, getSearchClause } = require('../utils/pagination');
const realtime = require('../utils/realtime');

const getAllExpenses = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const order = getOrder(query.sort, [['date', 'DESC']]);
  const searchClause = getSearchClause(query.search, ['description', 'category']);

  const whereClause = { ...searchClause };
  if (query.category) {
    whereClause.category = query.category;
  }
  if (query.payment_method) {
    whereClause.payment_method = query.payment_method;
  }
  if (query.from && query.to) {
    whereClause.date = {
      [Op.between]: [query.from, query.to],
    };
  } else if (query.from) {
    whereClause.date = { [Op.gte]: query.from };
  } else if (query.to) {
    whereClause.date = { [Op.lte]: query.to };
  }

  const data = await Expense.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: PurchaseOrder,
        as: 'purchase_order',
        attributes: ['id', 'po_number', 'supplier', 'total_cost'],
      },
      {
        model: StockOpnameSession,
        as: 'stock_opname_session',
        attributes: ['id', 'opname_number', 'total_loss_value'],
      },
    ],
    order,
    limit,
    offset,
  });

  return getPagingData(data, page, limit);
};

const getExpenseById = async (id) => {
  const expense = await Expense.findByPk(id, {
    include: [
      {
        model: PurchaseOrder,
        as: 'purchase_order',
      },
      {
        model: StockOpnameSession,
        as: 'stock_opname_session',
      },
    ],
  });

  if (!expense) {
    throw new AppError('Data pengeluaran tidak ditemukan.', 404);
  }

  return expense;
};

const createExpense = async (expenseData) => {
  const expense = await Expense.create(expenseData);
  realtime.broadcast('expense:created', { id: expense.id });
  return expense;
};

const updateExpense = async (id, updateData) => {
  const expense = await Expense.findByPk(id);
  if (!expense) {
    throw new AppError('Data pengeluaran tidak ditemukan.', 404);
  }

  Object.assign(expense, updateData);
  await expense.save();

  const updated = await getExpenseById(id);
  realtime.broadcast('expense:updated', { id });
  return updated;
};

const deleteExpense = async (id) => {
  const expense = await Expense.findByPk(id);
  if (!expense) {
    throw new AppError('Data pengeluaran tidak ditemukan.', 404);
  }

  // Jika terkait langsung dengan PO atau SO otomatis, beri peringatan
  if (expense.reference_po_id || expense.reference_so_id) {
    throw new AppError(
      'Pengeluaran yang tercatat otomatis dari PO atau Stok Opname tidak dapat dihapus langsung.',
      400
    );
  }

  await expense.destroy();
  realtime.broadcast('expense:deleted', { id });
  return { id };
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
