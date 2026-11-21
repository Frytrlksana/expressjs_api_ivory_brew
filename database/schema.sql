-- ============================================================
-- SKEMA DATABASE POSTGRESQL: IVORY BREW CAFFE (16 TABEL)
-- Dapat dieksekusi langsung di SQL Console DBeaver
-- ============================================================

-- Ekstensi UUID (opsional jika menggunakan gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. TABEL ROLES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    badge_color VARCHAR(20) NOT NULL DEFAULT 'blue',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

-- ------------------------------------------------------------
-- 2. TABEL ROLE MENU PERMISSIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_menu_permissions (
    id VARCHAR(36) PRIMARY KEY,
    role_code VARCHAR(30) NOT NULL REFERENCES roles(code) ON DELETE CASCADE ON UPDATE CASCADE,
    allowed_route VARCHAR(100) NOT NULL
);

-- ------------------------------------------------------------
-- 3. TABEL USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_code VARCHAR(30) NOT NULL REFERENCES roles(code) ON DELETE RESTRICT ON UPDATE CASCADE,
    station VARCHAR(100),
    avatar VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ------------------------------------------------------------
-- 4. TABEL SHIFT SCHEDULES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shift_schedules (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    barista_name VARCHAR(100) NOT NULL, -- FK logis ke users.name
    station VARCHAR(100),
    days_active VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT
);

-- ------------------------------------------------------------
-- 5. TABEL RAW MATERIALS (Bahan Baku)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_materials (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    current_stock DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL,
    min_stock_alert DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    supplier VARCHAR(100)
);

-- ------------------------------------------------------------
-- 6. TABEL RECIPES (Resep Minuman)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    serving_size VARCHAR(50),
    estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 7. TABEL RECIPE ITEMS (BOM Komposisi Bahan Baku)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_items (
    id VARCHAR(36) PRIMARY KEY,
    recipe_id VARCHAR(36) NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    material_id VARCHAR(36) NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL
);

-- ------------------------------------------------------------
-- 8. TABEL PRODUCTS (Katalog Menu POS)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    recipe_id VARCHAR(36) REFERENCES recipes(id) ON DELETE SET NULL,
    image VARCHAR(255),
    stock INT NOT NULL DEFAULT 0,
    description TEXT,
    is_best_seller BOOLEAN NOT NULL DEFAULT FALSE
);

-- ------------------------------------------------------------
-- 9. TABEL ORDER TRANSACTIONS (Transaksi Kasir)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_transactions (
    id VARCHAR(36) PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cashier_name VARCHAR(100) NOT NULL, -- FK logis ke users.name
    order_type VARCHAR(20) NOT NULL,    -- dine-in, takeaway, delivery
    table_number VARCHAR(20),
    customer_name VARCHAR(100),
    subtotal DECIMAL(12,2) NOT NULL,
    tax DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,
    cash_given DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    change DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(20) NOT NULL, -- qris, cash, card
    status VARCHAR(20) NOT NULL DEFAULT 'completed' -- completed, cancelled
);

-- ------------------------------------------------------------
-- 10. TABEL ORDER ITEMS (Detail Produk Transaksi)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL REFERENCES order_transactions(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2) NOT NULL,
    notes VARCHAR(255)
);

-- ------------------------------------------------------------
-- 11. TABEL PURCHASE ORDERS (Pengadaan Bahan Baku)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(36) PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL,         -- lunas, tempo
    payment_method VARCHAR(20) NOT NULL, -- kas, bank
    due_date DATE,
    notes TEXT
);

-- ------------------------------------------------------------
-- 12. TABEL PURCHASE ORDER ITEMS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id VARCHAR(36) PRIMARY KEY,
    po_id VARCHAR(36) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    material_id VARCHAR(36) NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    quantity DECIMAL(12,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL
);

-- ------------------------------------------------------------
-- 13. TABEL STOCK OPNAME SESSIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_opname_sessions (
    id VARCHAR(36) PRIMARY KEY,
    opname_number VARCHAR(50) UNIQUE NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cadence VARCHAR(20) NOT NULL,       -- monthly, weekly, daily, ad_hoc
    auditor_name VARCHAR(100) NOT NULL, -- FK logis ke users.name
    scope VARCHAR(30) NOT NULL,         -- all, perishable, raw_material, product
    total_discrepancy_items INT NOT NULL DEFAULT 0,
    total_loss_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_surplus_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    auto_expense_created BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT
);

-- ------------------------------------------------------------
-- 14. TABEL STOCK OPNAME ITEMS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_opname_items (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL REFERENCES stock_opname_sessions(id) ON DELETE CASCADE,
    item_id VARCHAR(36) NOT NULL,       -- ID material atau produk
    item_type VARCHAR(20) NOT NULL,     -- raw_material, product
    system_stock DECIMAL(12,2) NOT NULL,
    physical_stock DECIMAL(12,2) NOT NULL,
    difference DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    difference_cost DECIMAL(12,2) NOT NULL,
    reason VARCHAR(30) NOT NULL,        -- calibration, spillage, expired, damaged, dll
    notes TEXT
);

-- ------------------------------------------------------------
-- 15. TABEL STOCK OPNAME SCHEDULES (Konfigurasi Jadwal Aktif)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_opname_schedules (
    id VARCHAR(36) PRIMARY KEY,
    primary_cadence VARCHAR(20) NOT NULL DEFAULT 'monthly',
    daily_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    daily_target_time VARCHAR(10) NOT NULL DEFAULT '21:30',
    weekly_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    weekly_day INT NOT NULL DEFAULT 0, -- 0 = Minggu
    monthly_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    monthly_day INT NOT NULL DEFAULT 28,
    monthly_reminder_days INT NOT NULL DEFAULT 3,
    default_scope VARCHAR(30) NOT NULL DEFAULT 'all',
    default_auto_expense BOOLEAN NOT NULL DEFAULT FALSE
);

-- ------------------------------------------------------------
-- 16. TABEL EXPENSES (Beban & Pengeluaran)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(36) PRIMARY KEY,
    date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,       -- bahan-baku, operasional, utilitas, gaji, maintenance
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- kas, bank
    reference_po_id VARCHAR(36) REFERENCES purchase_orders(id) ON DELETE SET NULL,
    reference_so_id VARCHAR(36) REFERENCES stock_opname_sessions(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEX UNTUK PERFORMA QUERY
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_order_receipt ON order_transactions(receipt_number);
CREATE INDEX IF NOT EXISTS idx_order_date ON order_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_so_number ON stock_opname_sessions(opname_number);
CREATE INDEX IF NOT EXISTS idx_expense_date ON expenses(date);
