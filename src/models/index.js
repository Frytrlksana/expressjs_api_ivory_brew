/**
 * Inisialisasi Seluruh Model dan Asosiasi Database Ivory Brew Caffe
 */
const { sequelize } = require('../config/database');

// Domain 1: Katalog, Resep, Bahan Baku
const Product = require('./Product');
const Recipe = require('./Recipe');
const RecipeItem = require('./RecipeItem');
const RawMaterial = require('./RawMaterial');

// Domain 2: Kasir & Transaksi
const OrderTransaction = require('./OrderTransaction');
const OrderItem = require('./OrderItem');
const CustomerMember = require('./CustomerMember');

// Domain 3: Pengadaan
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');

// Domain 4: Stok Opname
const StockOpnameSession = require('./StockOpnameSession');
const StockOpnameItem = require('./StockOpnameItem');
const StockOpnameSchedule = require('./StockOpnameSchedule');

// Domain 5: Keuangan
const Expense = require('./Expense');

// Domain 6: Pengguna & Otorisasi
const Role = require('./Role');
const RoleMenuPermission = require('./RoleMenuPermission');
const User = require('./User');
const ShiftSchedule = require('./ShiftSchedule');

// ============================================================
// DEFINISI RELASI / ASOSIASI (PERSIS SESUAI SPESIFIKASI)
// ============================================================

// 1. Roles 1:N Users (role_code -> code)
Role.hasMany(User, {
  foreignKey: 'role_code',
  sourceKey: 'code',
  as: 'users',
});
User.belongsTo(Role, {
  foreignKey: 'role_code',
  targetKey: 'code',
  as: 'role',
});

// 2. Roles 1:N RoleMenuPermissions (role_code -> code)
Role.hasMany(RoleMenuPermission, {
  foreignKey: 'role_code',
  sourceKey: 'code',
  as: 'permissions',
});
RoleMenuPermission.belongsTo(Role, {
  foreignKey: 'role_code',
  targetKey: 'code',
  as: 'role',
});

// 3. Users 1:N ShiftSchedules (barista_name -> name, FK logis)
User.hasMany(ShiftSchedule, {
  foreignKey: 'barista_name',
  sourceKey: 'name',
  as: 'shift_schedules',
  constraints: false,
});
ShiftSchedule.belongsTo(User, {
  foreignKey: 'barista_name',
  targetKey: 'name',
  as: 'barista',
  constraints: false,
});

// 4. Recipes 1:1 Products (products.recipe_id)
Recipe.hasOne(Product, {
  foreignKey: 'recipe_id',
  as: 'product',
});
Product.belongsTo(Recipe, {
  foreignKey: 'recipe_id',
  as: 'recipe',
});

// 5. Recipes 1:N RecipeItems & RawMaterials 1:N RecipeItems
Recipe.hasMany(RecipeItem, {
  foreignKey: 'recipe_id',
  as: 'items',
});
RecipeItem.belongsTo(Recipe, {
  foreignKey: 'recipe_id',
  as: 'recipe',
});

RawMaterial.hasMany(RecipeItem, {
  foreignKey: 'material_id',
  as: 'recipe_items',
});
RecipeItem.belongsTo(RawMaterial, {
  foreignKey: 'material_id',
  as: 'material',
});

// 6. OrderTransactions 1:N OrderItems & Products 1:N OrderItems
OrderTransaction.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
});
OrderItem.belongsTo(OrderTransaction, {
  foreignKey: 'order_id',
  as: 'order',
});

// 6b. CustomerMembers 1:N OrderTransactions
CustomerMember.hasMany(OrderTransaction, {
  foreignKey: 'customer_phone',
  sourceKey: 'phone',
  as: 'orders',
  constraints: false,
});
OrderTransaction.belongsTo(CustomerMember, {
  foreignKey: 'customer_phone',
  targetKey: 'phone',
  as: 'member',
  constraints: false,
});

Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'order_items',
});
OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

// 7. PurchaseOrders 1:N PurchaseOrderItems & RawMaterials 1:N PurchaseOrderItems
PurchaseOrder.hasMany(PurchaseOrderItem, {
  foreignKey: 'po_id',
  as: 'items',
});
PurchaseOrderItem.belongsTo(PurchaseOrder, {
  foreignKey: 'po_id',
  as: 'purchase_order',
});

RawMaterial.hasMany(PurchaseOrderItem, {
  foreignKey: 'material_id',
  as: 'po_items',
});
PurchaseOrderItem.belongsTo(RawMaterial, {
  foreignKey: 'material_id',
  as: 'material',
});

// 8. PurchaseOrders 1:1 Expenses (reference_po_id)
PurchaseOrder.hasOne(Expense, {
  foreignKey: 'reference_po_id',
  as: 'expense',
});
Expense.belongsTo(PurchaseOrder, {
  foreignKey: 'reference_po_id',
  as: 'purchase_order',
});

// 9. StockOpnameSessions 1:1 Expenses (reference_so_id)
StockOpnameSession.hasOne(Expense, {
  foreignKey: 'reference_so_id',
  as: 'expense',
});
Expense.belongsTo(StockOpnameSession, {
  foreignKey: 'reference_so_id',
  as: 'stock_opname_session',
});

// 10. StockOpnameSessions 1:N StockOpnameItems
StockOpnameSession.hasMany(StockOpnameItem, {
  foreignKey: 'session_id',
  as: 'items',
});
StockOpnameItem.belongsTo(StockOpnameSession, {
  foreignKey: 'session_id',
  as: 'session',
});

module.exports = {
  sequelize,
  Role,
  RoleMenuPermission,
  User,
  ShiftSchedule,
  RawMaterial,
  Recipe,
  RecipeItem,
  Product,
  OrderTransaction,
  OrderItem,
  CustomerMember,
  PurchaseOrder,
  PurchaseOrderItem,
  StockOpnameSession,
  StockOpnameItem,
  StockOpnameSchedule,
  Expense,
};
