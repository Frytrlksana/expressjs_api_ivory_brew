/**
 * Generator Nomor Dokumen Transaksi, Pengadaan, dan Stok Opname
 */
const { Op } = require('sequelize');

/**
 * Format string tanggal: YYYYMMDD atau YYYYMM
 */
const getFormattedDate = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return {
    year,
    month,
    day,
    ymd: `${year}${month}${day}`,
    ym: `${year}${month}`,
  };
};

/**
 * Generate nomor struk transaksi kasir (IBC-YYYYMMDD-XXX)
 * Urut harian, 3 digit
 */
const generateReceiptNumber = async (OrderTransactionModel, transaction = null) => {
  const { ymd } = getFormattedDate();
  const prefix = `IBC-${ymd}-`;

  const lastOrder = await OrderTransactionModel.findOne({
    where: {
      receipt_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['receipt_number', 'DESC']],
    transaction,
  });

  let nextSequence = 1;
  if (lastOrder && lastOrder.receipt_number) {
    const parts = lastOrder.receipt_number.split('-');
    const currentSeq = parseInt(parts[2], 10);
    if (!isNaN(currentSeq)) {
      nextSequence = currentSeq + 1;
    }
  }

  const sequenceFormatted = String(nextSequence).padStart(3, '0');
  return `${prefix}${sequenceFormatted}`;
};

/**
 * Generate nomor Purchase Order (PO-IBC-YYYYMM-XX)
 * Urut bulanan, minimal 2 digit
 */
const generatePoNumber = async (PurchaseOrderModel, transaction = null) => {
  const { ym } = getFormattedDate();
  const prefix = `PO-IBC-${ym}-`;

  const lastPo = await PurchaseOrderModel.findOne({
    where: {
      po_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['po_number', 'DESC']],
    transaction,
  });

  let nextSequence = 1;
  if (lastPo && lastPo.po_number) {
    const parts = lastPo.po_number.split('-');
    const currentSeq = parseInt(parts[3], 10);
    if (!isNaN(currentSeq)) {
      nextSequence = currentSeq + 1;
    }
  }

  const sequenceFormatted = String(nextSequence).padStart(2, '0');
  return `${prefix}${sequenceFormatted}`;
};

/**
 * Generate nomor sesi Stok Opname (SOYYYYMMDD-XXX)
 * Urut harian, 3 digit
 */
const generateOpnameNumber = async (StockOpnameSessionModel, transaction = null) => {
  const { ymd } = getFormattedDate();
  const prefix = `SO${ymd}-`;

  const lastOpname = await StockOpnameSessionModel.findOne({
    where: {
      opname_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['opname_number', 'DESC']],
    transaction,
  });

  let nextSequence = 1;
  if (lastOpname && lastOpname.opname_number) {
    const parts = lastOpname.opname_number.split('-');
    const currentSeq = parseInt(parts[1], 10);
    if (!isNaN(currentSeq)) {
      nextSequence = currentSeq + 1;
    }
  }

  const sequenceFormatted = String(nextSequence).padStart(3, '0');
  return `${prefix}${sequenceFormatted}`;
};

module.exports = {
  getFormattedDate,
  generateReceiptNumber,
  generatePoNumber,
  generateOpnameNumber,
};
