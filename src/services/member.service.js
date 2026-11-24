/**
 * Service Data Member & Customer Loyalty WhatsApp
 */
const { Op } = require('sequelize');
const { CustomerMember, OrderTransaction, OrderItem, Product } = require('../models');
const AppError = require('../utils/AppError');
const realtime = require('../utils/realtime');

/**
 * Format string nomor telepon (membersihkan spasi / tanda minus)
 */
const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '');
};

/**
 * Dapatkan seluruh data member dengan filter, search, dan pagination
 */
const getAllMembers = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 50;
  const offset = (page - 1) * limit;
  const search = (query.search || '').trim();
  const filter = query.filter || 'all'; // 'all', 'ready_to_claim', 'loyal'

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  if (filter === 'ready_to_claim') {
    where.stamps = { [Op.gte]: 9 };
  } else if (filter === 'loyal') {
    where.total_cups_purchased = { [Op.gte]: 10 };
  }

  const { count, rows } = await CustomerMember.findAndCountAll({
    where,
    order: [
      ['last_visit', 'DESC'],
      ['created_at', 'DESC'],
    ],
    limit,
    offset,
  });

  return {
    total_items: count,
    members: rows,
    total_pages: Math.ceil(count / limit),
    current_page: page,
  };
};

/**
 * Cari member berdasarkan nomor WhatsApp
 */
const getMemberByPhone = async (phone) => {
  const clean = cleanPhoneNumber(phone);
  if (!clean) return null;

  // Cari exact match atau kemiripan sufiks/prefiks nomor
  const member = await CustomerMember.findOne({
    where: {
      [Op.or]: [
        { phone: clean },
        { phone: { [Op.like]: `%${clean.slice(-9)}%` } },
      ],
    },
  });

  return member;
};

/**
 * Dapatkan detail member berdasarkan ID beserta riwayat pesanan terakhir
 */
const getMemberById = async (id) => {
  const member = await CustomerMember.findByPk(id);
  if (!member) {
    throw new AppError('Member tidak ditemukan', 404);
  }

  // Ambil transaksi terakhir jika ada
  const recentOrders = await OrderTransaction.findAll({
    where: { customer_phone: member.phone },
    limit: 5,
    order: [['created_at', 'DESC']],
    include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
  });

  return {
    ...member.toJSON(),
    recent_orders: recentOrders,
  };
};

/**
 * Buat member baru
 */
const createMember = async (data) => {
  const phone = cleanPhoneNumber(data.phone);
  const existing = await CustomerMember.findOne({ where: { phone } });
  if (existing) {
    throw new AppError(`Nomor WhatsApp '${phone}' sudah terdaftar atas nama ${existing.name}.`, 409);
  }

  const newMember = await CustomerMember.create({
    phone,
    name: data.name.trim(),
    stamps: data.stamps || 0,
    total_cups_purchased: 0,
    stamps_claimed: 0,
    created_at: new Date(),
    last_visit: new Date(),
  });

  realtime.broadcast('member:created', newMember);
  return newMember;
};

/**
 * Perbarui data member (nama, nomor HP, atau koreksi stamp)
 */
const updateMember = async (id, data) => {
  const member = await CustomerMember.findByPk(id);
  if (!member) {
    throw new AppError('Member tidak ditemukan', 404);
  }

  if (data.phone) {
    const cleanPhone = cleanPhoneNumber(data.phone);
    if (cleanPhone !== member.phone) {
      const existing = await CustomerMember.findOne({ where: { phone: cleanPhone } });
      if (existing && existing.id !== id) {
        throw new AppError(`Nomor WhatsApp '${cleanPhone}' sudah digunakan oleh member lain.`, 409);
      }
      member.phone = cleanPhone;
    }
  }

  if (data.name !== undefined) member.name = data.name.trim();
  if (data.stamps !== undefined) member.stamps = Number(data.stamps);
  if (data.total_cups_purchased !== undefined) member.total_cups_purchased = Number(data.total_cups_purchased);
  if (data.stamps_claimed !== undefined) member.stamps_claimed = Number(data.stamps_claimed);

  await member.save();
  realtime.broadcast('member:updated', member);
  return member;
};

/**
 * Hapus member
 */
const deleteMember = async (id) => {
  const member = await CustomerMember.findByPk(id);
  if (!member) {
    throw new AppError('Member tidak ditemukan', 404);
  }

  await member.destroy();
  realtime.broadcast('member:deleted', { id });
  return { message: 'Member berhasil dihapus' };
};

/**
 * Klaim hadiah kopi gratis (Beli 9 Gratis 1 Kopi)
 */
const claimReward = async (phone) => {
  const clean = cleanPhoneNumber(phone);
  const member = await getMemberByPhone(clean);
  if (!member) {
    throw new AppError('Data member tidak ditemukan', 404);
  }

  if (member.stamps < 9) {
    throw new AppError(`Stamp belum mencukupi untuk klaim kopi gratis. Saat ini: ${member.stamps}/9 stamp.`, 400);
  }

  member.stamps = Math.max(0, member.stamps - 9);
  member.stamps_claimed += 1;
  member.last_visit = new Date();
  await member.save();

  realtime.broadcast('member:updated', member);
  return member;
};

/**
 * Otomatisasi penambahan stamp & pembaruan minuman favorit pada transaksi order
 */
const processOrderLoyalty = async (customerPhone, customerName, items, productMap, transaction = null) => {
  if (!customerPhone) return null;
  const clean = cleanPhoneNumber(customerPhone);
  if (!clean) return null;

  let member = await CustomerMember.findOne({
    where: { phone: clean },
    transaction,
  });

  if (!member) {
    // Otomatis daftarkan jika belum terdaftar
    member = await CustomerMember.create(
      {
        phone: clean,
        name: customerName || 'Pelanggan Setia',
        stamps: 0,
        total_cups_purchased: 0,
        stamps_claimed: 0,
        created_at: new Date(),
        last_visit: new Date(),
      },
      { transaction }
    );
  }

  // Hitung jumlah cangkir yang dipesan
  let cupsCount = 0;
  let topDrinkCandidate = null;
  let topDrinkQty = 0;

  for (const it of items) {
    const qty = Number(it.quantity) || 1;
    cupsCount += qty;

    if (qty >= topDrinkQty) {
      const prod = productMap.get(it.product_id);
      if (prod) {
        topDrinkQty = qty;
        topDrinkCandidate = {
          productId: prod.id,
          productName: prod.name,
          modifiersSummary: it.modifiers_summary || '',
          unitPrice: Number(prod.price),
        };
      }
    }
  }

  // Update akumulasi stamps (maksimum slot 9 sebelum diklaim)
  const newStamps = Math.min(9, member.stamps + cupsCount);
  member.stamps = newStamps;
  member.total_cups_purchased += cupsCount;
  member.last_visit = new Date();

  // Update minuman favorit jika ada kandidat
  if (topDrinkCandidate) {
    let currentFav = member.favorite_drink;
    if (typeof currentFav === 'string') {
      try {
        currentFav = JSON.parse(currentFav);
      } catch (e) {
        currentFav = null;
      }
    }

    if (!currentFav || currentFav.productId === topDrinkCandidate.productId) {
      member.favorite_drink = {
        ...topDrinkCandidate,
        timesOrdered: (currentFav?.timesOrdered || 0) + topDrinkQty,
      };
    } else if (topDrinkQty >= 2) {
      member.favorite_drink = {
        ...topDrinkCandidate,
        timesOrdered: topDrinkQty,
      };
    }
  }

  await member.save({ transaction });
  realtime.broadcast('member:updated', member);
  return member;
};

module.exports = {
  cleanPhoneNumber,
  getAllMembers,
  getMemberByPhone,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  claimReward,
  processOrderLoyalty,
};
