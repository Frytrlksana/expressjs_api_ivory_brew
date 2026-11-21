/**
 * Service Stok Opname & Jadwal Audit
 */
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const AppError = require('../utils/AppError');
const {
  StockOpnameSession,
  StockOpnameItem,
  StockOpnameSchedule,
  RawMaterial,
  Product,
  Expense,
  User,
} = require('../models');
const { generateOpnameNumber } = require('../utils/generators');
const { getPagination, getPagingData, getOrder, getSearchClause } = require('../utils/pagination');
const { ITEM_TYPES } = require('../config/constants');
const realtime = require('../utils/realtime');

/**
 * Membuat Sesi Stok Opname Baru dan Menyesuaikan Stok
 */
const createOpnameSession = async (sessionData, currentUser) => {
  const sessionResult = await sequelize.transaction(async (t) => {
    // 1. Validasi auditor_name
    const auditorName = sessionData.auditor_name || currentUser.name;
    const auditorUser = await User.findOne({ where: { name: auditorName }, transaction: t });
    if (!auditorUser) {
      throw new AppError(`Auditor '${auditorName}' tidak terdaftar di sistem.`, 400);
    }

    // 2. Ambil konfigurasi jadwal untuk auto expense
    let schedule = await StockOpnameSchedule.findOne({ transaction: t });
    if (!schedule) {
      schedule = await StockOpnameSchedule.create(
        {
          primary_cadence: 'monthly',
          daily_enabled: false,
          weekly_enabled: false,
          monthly_enabled: true,
          monthly_day: 28,
          monthly_reminder_days: 3,
          default_scope: 'all',
          default_auto_expense: false,
        },
        { transaction: t }
      );
    }

    const autoExpenseEnabled = Boolean(schedule.default_auto_expense);

    // 3. Generate nomor sesi SOYYYYMMDD-XXX
    const opnameNumber = await generateOpnameNumber(StockOpnameSession, t);

    // 4. Proses setiap item opname
    let totalDiscrepancyItems = 0;
    let totalLossValue = 0;     // akumulasi selisih minus, disimpan positif
    let totalSurplusValue = 0;  // akumulasi selisih plus
    const itemsToCreate = [];

    for (const itemInput of sessionData.items) {
      let systemStock = 0;
      let unitCost = 0;

      if (itemInput.item_type === ITEM_TYPES.RAW_MATERIAL) {
        const material = await RawMaterial.findByPk(itemInput.item_id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!material) {
          throw new AppError(`Bahan baku ID '${itemInput.item_id}' tidak ditemukan.`, 404);
        }

        systemStock = Number(material.current_stock);
        unitCost = Number(material.unit_price);

        // Update stok aktual ke physical_stock
        material.current_stock = itemInput.physical_stock;
        await material.save({ transaction: t });
      } else if (itemInput.item_type === ITEM_TYPES.PRODUCT) {
        const product = await Product.findByPk(itemInput.item_id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!product) {
          throw new AppError(`Produk ID '${itemInput.item_id}' tidak ditemukan.`, 404);
        }

        systemStock = Number(product.stock);
        unitCost = Number(product.cost_price);

        // Update stok fisik produk
        product.stock = Math.round(itemInput.physical_stock);
        await product.save({ transaction: t });
      } else {
        throw new AppError(`Tipe item '${itemInput.item_type}' tidak valid.`, 400);
      }

      const physicalStock = Number(itemInput.physical_stock);
      const difference = Number((physicalStock - systemStock).toFixed(2));
      const differenceCost = Number((difference * unitCost).toFixed(2));

      if (difference !== 0) {
        totalDiscrepancyItems += 1;
        if (difference < 0) {
          totalLossValue += Math.abs(differenceCost);
        } else {
          totalSurplusValue += differenceCost;
        }
      }

      itemsToCreate.push({
        item_id: itemInput.item_id,
        item_type: itemInput.item_type,
        system_stock: systemStock,
        physical_stock: physicalStock,
        difference,
        unit_cost: unitCost,
        difference_cost: differenceCost,
        reason: itemInput.reason,
        notes: itemInput.notes || null,
      });
    }

    totalLossValue = Number(totalLossValue.toFixed(2));
    totalSurplusValue = Number(totalSurplusValue.toFixed(2));

    // 5. Buat Sesi Opname
    const session = await StockOpnameSession.create(
      {
        opname_number: opnameNumber,
        date: new Date(),
        cadence: sessionData.cadence,
        auditor_name: auditorName,
        scope: sessionData.scope,
        total_discrepancy_items: totalDiscrepancyItems,
        total_loss_value: totalLossValue,
        total_surplus_value: totalSurplusValue,
        auto_expense_created: false,
        notes: sessionData.notes || null,
      },
      { transaction: t }
    );

    // 6. Simpan item-item opname
    for (const it of itemsToCreate) {
      it.session_id = session.id;
    }
    await StockOpnameItem.bulkCreate(itemsToCreate, { transaction: t });

    // 7. Jika ada kerugian dan auto_expense aktif, buat Expense operasional
    if (totalLossValue > 0 && autoExpenseEnabled) {
      await Expense.create(
        {
          date: new Date().toISOString().split('T')[0],
          category: 'operasional',
          amount: totalLossValue,
          description: `Penyesuaian Kerugian Stok Opname ${session.opname_number}`,
          payment_method: 'kas',
          reference_so_id: session.id,
        },
        { transaction: t }
      );
      session.auto_expense_created = true;
      await session.save({ transaction: t });
    }

    const result = await getOpnameSessionById(session.id, t);
    return result;
  });

  realtime.broadcast('opname:created', { id: sessionResult.id, opname_number: sessionResult.opname_number });
  realtime.broadcast('raw-material:updated', {});
  realtime.broadcast('product:updated', {});
  if (sessionResult.auto_expense_created) {
    realtime.broadcast('expense:created', {});
  }
  return sessionResult;
};

const getAllOpnameSessions = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const order = getOrder(query.sort, [['date', 'DESC']]);
  const searchClause = getSearchClause(query.search, [
    'opname_number',
    'auditor_name',
    'scope',
    'notes',
  ]);

  const whereClause = { ...searchClause };
  if (query.cadence) {
    whereClause.cadence = query.cadence;
  }
  if (query.scope) {
    whereClause.scope = query.scope;
  }

  const data = await StockOpnameSession.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: StockOpnameItem,
        as: 'items',
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

const getOpnameSessionById = async (id, transaction = null) => {
  const session = await StockOpnameSession.findByPk(id, {
    include: [
      {
        model: StockOpnameItem,
        as: 'items',
      },
      {
        model: Expense,
        as: 'expense',
      },
    ],
    transaction,
  });

  if (!session) {
    throw new AppError('Sesi stok opname tidak ditemukan.', 404);
  }

  return session;
};

/**
 * Konfigurasi Jadwal Stok Opname (Single Active Config)
 */
const getSchedule = async () => {
  let schedule = await StockOpnameSchedule.findOne();
  if (!schedule) {
    schedule = await StockOpnameSchedule.create({
      primary_cadence: 'monthly',
      daily_enabled: false,
      daily_target_time: '21:30',
      weekly_enabled: false,
      weekly_day: 0,
      monthly_enabled: true,
      monthly_day: 28,
      monthly_reminder_days: 3,
      default_scope: 'all',
      default_auto_expense: false,
    });
  }
  return schedule;
};

const updateSchedule = async (updateData) => {
  let schedule = await StockOpnameSchedule.findOne();
  if (!schedule) {
    schedule = await StockOpnameSchedule.create(updateData);
    realtime.broadcast('opname-schedule:updated', schedule);
    return schedule;
  }

  Object.assign(schedule, updateData);
  await schedule.save();
  realtime.broadcast('opname-schedule:updated', schedule);
  return schedule;
};

/**
 * Evaluasi Pengingat Audit Stok Opname
 */
const getReminders = async () => {
  const schedule = await getSchedule();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based
  const currentDay = now.getDate();
  const currentDayOfWeek = now.getDay(); // 0 = Minggu

  const reminders = {
    need_reminder: false,
    alerts: [],
    details: {
      monthly: { active: schedule.monthly_enabled, due: false },
      weekly: { active: schedule.weekly_enabled, due: false },
      daily: { active: schedule.daily_enabled, due: false },
    },
  };

  // 1. Evaluasi Bulanan
  if (schedule.monthly_enabled) {
    const reminderStartDay = schedule.monthly_day - schedule.monthly_reminder_days;
    const isWithinMonthlyWindow = currentDay >= reminderStartDay;

    if (isWithinMonthlyWindow) {
      // Cek apakah sudah ada sesi opname 'monthly' di bulan berjalan
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      const existingMonthly = await StockOpnameSession.findOne({
        where: {
          cadence: 'monthly',
          date: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
      });

      if (!existingMonthly) {
        reminders.need_reminder = true;
        reminders.details.monthly.due = true;
        reminders.alerts.push({
          type: 'monthly',
          message: `Stok opname bulanan jatuh tempo pada tanggal ${schedule.monthly_day}. Belum ada sesi opname bulan ini.`,
        });
      }
    }
  }

  // 2. Evaluasi Mingguan
  if (schedule.weekly_enabled && currentDayOfWeek === schedule.weekly_day) {
    // Cek apakah sudah ada sesi opname 'weekly' dalam 7 hari terakhir
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const existingWeekly = await StockOpnameSession.findOne({
      where: {
        cadence: 'weekly',
        date: {
          [Op.gte]: sevenDaysAgo,
        },
      },
    });

    if (!existingWeekly) {
      reminders.need_reminder = true;
      reminders.details.weekly.due = true;
      reminders.alerts.push({
        type: 'weekly',
        message: 'Jadwal audit mingguan hari ini belum dilaksanakan.',
      });
    }
  }

  // 3. Evaluasi Harian
  if (schedule.daily_enabled) {
    const startOfDay = new Date(currentYear, currentMonth, currentDay, 0, 0, 0);
    const endOfDay = new Date(currentYear, currentMonth, currentDay, 23, 59, 59);

    const existingDaily = await StockOpnameSession.findOne({
      where: {
        cadence: 'daily',
        date: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    if (!existingDaily) {
      reminders.details.daily.due = true;
      reminders.alerts.push({
        type: 'daily',
        message: `Stok opname harian ditargetkan pukul ${schedule.daily_target_time}.`,
      });
    }
  }

  return reminders;
};

module.exports = {
  createOpnameSession,
  getAllOpnameSessions,
  getOpnameSessionById,
  getSchedule,
  updateSchedule,
  getReminders,
};
