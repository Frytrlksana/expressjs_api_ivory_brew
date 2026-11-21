/**
 * Konstanta Domain Sistem Ivory Brew Caffe
 */
module.exports = {
  ROLES: {
    MANAGER: 'manager',
    BARISTA: 'barista',
    FINANCE: 'finance',
    SUPERVISOR: 'supervisor',
  },
  ROLE_BADGES: {
    MANAGER: 'amber',
    BARISTA: 'emerald',
    FINANCE: 'blue',
    SUPERVISOR: 'purple',
  },
  ORDER_TYPES: ['dine-in', 'takeaway', 'delivery'],
  ORDER_STATUS: {
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
  PAYMENT_METHODS_ORDER: ['qris', 'cash', 'card'],
  PAYMENT_METHODS_PO: ['kas', 'bank'],
  PAYMENT_METHODS_EXPENSE: ['kas', 'bank'],
  PO_STATUS: {
    LUNAS: 'lunas',
    TEMPO: 'tempo',
  },
  EXPENSE_CATEGORIES: [
    'bahan-baku',
    'operasional',
    'utilitas',
    'gaji',
    'maintenance',
  ],
  OPNAME_CADENCE: {
    MONTHLY: 'monthly',
    WEEKLY: 'weekly',
    DAILY: 'daily',
    AD_HOC: 'ad_hoc',
  },
  OPNAME_SCOPES: ['all', 'perishable', 'raw_material', 'product'],
  ITEM_TYPES: {
    RAW_MATERIAL: 'raw_material',
    PRODUCT: 'product',
  },
  ALLOWED_ROUTES: ['/', '/pos', '/purchasing', '/finance', '/settings'],
  DEFAULT_ROLE_PERMISSIONS: {
    manager: ['/', '/pos', '/purchasing', '/finance', '/settings'],
    barista: ['/pos'],
    finance: ['/purchasing', '/finance'],
    supervisor: ['/pos', '/purchasing'],
  },
};
