/**
 * Service Laporan Keuangan, Penjualan, & Produk (Reports)
 */
const { Op, fn, col, literal } = require('sequelize');
const {
  OrderTransaction,
  OrderItem,
  Product,
  Expense,
} = require('../models');
const { ORDER_STATUS } = require('../config/constants');

/**
 * Filter rentang tanggal untuk kolom timestamp / date
 */
const buildDateFilter = (from, to, column = 'created_at') => {
  if (from && to) {
    return {
      [column]: {
        [Op.between]: [new Date(`${from}T00:00:00.000Z`), new Date(`${to}T23:59:59.999Z`)],
      },
    };
  }
  if (from) {
    return {
      [column]: {
        [Op.gte]: new Date(`${from}T00:00:00.000Z`),
      },
    };
  }
  if (to) {
    return {
      [column]: {
        [Op.lte]: new Date(`${to}T23:59:59.999Z`),
      },
    };
  }
  return {};
};

/**
 * 1. Ringkasan Penjualan (Sales Summary)
 */
const getSalesSummary = async (from, to) => {
  const dateFilter = buildDateFilter(from, to, 'created_at');
  const whereClause = {
    status: ORDER_STATUS.COMPLETED,
    ...dateFilter,
  };

  const orders = await OrderTransaction.findAll({
    where: whereClause,
    attributes: [
      'id',
      'receipt_number',
      'created_at',
      'order_type',
      'payment_method',
      'subtotal',
      'discount',
      'tax',
      'total',
    ],
  });

  const totalTransactions = orders.length;
  let totalGrossSales = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let totalNetSales = 0;

  const paymentBreakdown = {
    cash: { count: 0, amount: 0 },
    qris: { count: 0, amount: 0 },
    card: { count: 0, amount: 0 },
  };

  const orderTypeBreakdown = {
    'dine-in': { count: 0, amount: 0 },
    takeaway: { count: 0, amount: 0 },
    delivery: { count: 0, amount: 0 },
  };

  for (const ord of orders) {
    const sub = Number(ord.subtotal);
    const disc = Number(ord.discount);
    const tx = Number(ord.tax);
    const tot = Number(ord.total);

    totalGrossSales += sub;
    totalDiscount += disc;
    totalTax += tx;
    totalNetSales += tot;

    if (paymentBreakdown[ord.payment_method]) {
      paymentBreakdown[ord.payment_method].count += 1;
      paymentBreakdown[ord.payment_method].amount += tot;
    }

    if (orderTypeBreakdown[ord.order_type]) {
      orderTypeBreakdown[ord.order_type].count += 1;
      orderTypeBreakdown[ord.order_type].amount += tot;
    }
  }

  const averageOrderValue = totalTransactions > 0 ? totalNetSales / totalTransactions : 0;

  return {
    period: { from: from || 'all-time', to: to || 'all-time' },
    total_transactions: totalTransactions,
    total_gross_sales: Number(totalGrossSales.toFixed(2)),
    total_discount: Number(totalDiscount.toFixed(2)),
    total_tax: Number(totalTax.toFixed(2)),
    total_net_sales: Number(totalNetSales.toFixed(2)),
    average_order_value: Number(averageOrderValue.toFixed(2)),
    payment_breakdown: paymentBreakdown,
    order_type_breakdown: orderTypeBreakdown,
  };
};

/**
 * 2. Produk Terlaris (Best Sellers)
 */
const getBestSellers = async (limit = 10) => {
  const bestSellers = await OrderItem.findAll({
    attributes: [
      'product_id',
      [fn('SUM', col('OrderItem.quantity')), 'total_quantity_sold'],
      [fn('SUM', literal('quantity * unit_price')), 'total_revenue'],
      [fn('SUM', literal('quantity * cost_price')), 'total_cogs'],
    ],
    include: [
      {
        model: OrderTransaction,
        as: 'order',
        attributes: [],
        where: { status: ORDER_STATUS.COMPLETED },
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'category', 'price', 'cost_price', 'image', 'is_best_seller'],
      },
    ],
    group: ['OrderItem.product_id', 'product.id'],
    order: [[literal('total_quantity_sold'), 'DESC']],
    limit: Number(limit) || 10,
    raw: false,
  });

  return bestSellers.map((item) => {
    const qty = Number(item.getDataValue('total_quantity_sold') || 0);
    const rev = Number(item.getDataValue('total_revenue') || 0);
    const cogs = Number(item.getDataValue('total_cogs') || 0);
    const grossProfit = rev - cogs;

    return {
      product: item.product,
      total_quantity_sold: qty,
      total_revenue: Number(rev.toFixed(2)),
      total_cogs: Number(cogs.toFixed(2)),
      gross_profit: Number(grossProfit.toFixed(2)),
    };
  });
};

/**
 * 3. Laporan Laba Rugi (Profit & Loss)
 * Rumus: Pendapatan Bersih (Net Sales tanpa tax) − HPP − Total Beban (Expenses)
 */
const getProfitLoss = async (from, to) => {
  const dateFilterOrders = buildDateFilter(from, to, 'created_at');
  const dateFilterExpenses = from && to ? { date: { [Op.between]: [from, to] } } : {};

  // Fetch semua item order yang selesai
  const completedOrders = await OrderItem.findAll({
    attributes: [
      [fn('SUM', literal('quantity * unit_price')), 'gross_sales'],
      [fn('SUM', literal('quantity * cost_price')), 'total_cogs'],
    ],
    include: [
      {
        model: OrderTransaction,
        as: 'order',
        attributes: [],
        where: {
          status: ORDER_STATUS.COMPLETED,
          ...dateFilterOrders,
        },
      },
    ],
    raw: true,
  });

  // Hitung total diskon order
  const discountData = await OrderTransaction.findAll({
    attributes: [
      [fn('SUM', col('discount')), 'total_discount'],
      [fn('SUM', col('tax')), 'total_tax'],
    ],
    where: {
      status: ORDER_STATUS.COMPLETED,
      ...dateFilterOrders,
    },
    raw: true,
  });

  const grossSales = Number(completedOrders[0]?.gross_sales || 0);
  const totalCogs = Number(completedOrders[0]?.total_cogs || 0);
  const totalDiscount = Number(discountData[0]?.total_discount || 0);
  const totalTax = Number(discountData[0]?.total_tax || 0);

  // Pendapatan usaha bersih = Penjualan Kotor - Diskon
  const netRevenue = Math.max(0, grossSales - totalDiscount);
  // Laba Kotor (Gross Profit) = Pendapatan Bersih - HPP (COGS)
  const grossProfit = netRevenue - totalCogs;

  // Beban Operasional / Expenses
  const expenses = await Expense.findAll({
    attributes: [
      'category',
      [fn('SUM', col('amount')), 'total_amount'],
    ],
    where: dateFilterExpenses,
    group: ['category'],
    raw: true,
  });

  const expenseBreakdown = {};
  let totalExpenses = 0;

  for (const exp of expenses) {
    const amount = Number(exp.total_amount || 0);
    expenseBreakdown[exp.category] = amount;
    totalExpenses += amount;
  }

  // Laba Bersih (Net Profit) = Laba Kotor - Beban
  const netProfit = grossProfit - totalExpenses;

  return {
    period: { from: from || 'all-time', to: to || 'all-time' },
    revenue: {
      gross_sales: Number(grossSales.toFixed(2)),
      discounts: Number(totalDiscount.toFixed(2)),
      net_revenue: Number(netRevenue.toFixed(2)),
      tax_collected: Number(totalTax.toFixed(2)),
    },
    cost_of_goods_sold: Number(totalCogs.toFixed(2)),
    gross_profit: Number(grossProfit.toFixed(2)),
    operating_expenses: {
      total: Number(totalExpenses.toFixed(2)),
      by_category: expenseBreakdown,
    },
    net_profit: Number(netProfit.toFixed(2)),
    profit_margin_percentage: netRevenue > 0 ? Number(((netProfit / netRevenue) * 100).toFixed(2)) : 0,
  };
};

/**
 * 4. Arus Kas (Cashflow Berdasarkan Metode Kas/Bank)
 */
const getCashflow = async (from, to) => {
  const dateFilterOrders = buildDateFilter(from, to, 'created_at');
  const dateFilterExpenses = from && to ? { date: { [Op.between]: [from, to] } } : {};

  // Pemasukan dari kasir
  const salesInflow = await OrderTransaction.findAll({
    attributes: [
      'payment_method',
      [fn('SUM', col('total')), 'total_inflow'],
    ],
    where: {
      status: ORDER_STATUS.COMPLETED,
      ...dateFilterOrders,
    },
    group: ['payment_method'],
    raw: true,
  });

  // Pengeluaran dari expense
  const expensesOutflow = await Expense.findAll({
    attributes: [
      'payment_method',
      [fn('SUM', col('amount')), 'total_outflow'],
    ],
    where: dateFilterExpenses,
    group: ['payment_method'],
    raw: true,
  });

  const summary = {
    kas: { inflow: 0, outflow: 0, net: 0 },
    bank: { inflow: 0, outflow: 0, net: 0 },
  };

  // Petakan inflow: 'cash' -> kas, 'qris' & 'card' -> bank
  for (const row of salesInflow) {
    const val = Number(row.total_inflow || 0);
    if (row.payment_method === 'cash') {
      summary.kas.inflow += val;
    } else {
      summary.bank.inflow += val;
    }
  }

  // Petakan outflow: 'kas' -> kas, 'bank' -> bank
  for (const row of expensesOutflow) {
    const val = Number(row.total_outflow || 0);
    if (row.payment_method === 'kas') {
      summary.kas.outflow += val;
    } else if (row.payment_method === 'bank') {
      summary.bank.outflow += val;
    }
  }

  summary.kas.net = Number((summary.kas.inflow - summary.kas.outflow).toFixed(2));
  summary.bank.net = Number((summary.bank.inflow - summary.bank.outflow).toFixed(2));

  const totalInflow = summary.kas.inflow + summary.bank.inflow;
  const totalOutflow = summary.kas.outflow + summary.bank.outflow;
  const netCashflow = totalInflow - totalOutflow;

  return {
    period: { from: from || 'all-time', to: to || 'all-time' },
    summary: {
      kas: summary.kas,
      bank: summary.bank,
    },
    total_inflow: Number(totalInflow.toFixed(2)),
    total_outflow: Number(totalOutflow.toFixed(2)),
    net_cashflow: Number(netCashflow.toFixed(2)),
  };
};

module.exports = {
  getSalesSummary,
  getBestSellers,
  getProfitLoss,
  getCashflow,
};
