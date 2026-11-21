# Ivory Brew Caffe — Backend REST API Service

Backend REST API untuk sistem operasional lengkap **Ivory Brew Caffe** mencakup:
- Kasir POS (Point of Sale) & Penjualan Otomatis
- Resep & Bill of Materials (BOM)
- Pengadaan Bahan Baku (Purchase Order)
- Stok Opname & Audit Inventaris Berkala
- Keuangan (Beban Operasional, Arus Kas, Laba Rugi)
- Multi-User & Role-Based Access Control (RBAC)

Dibangun menggunakan **Node.js**, **Express.js**, **Sequelize ORM v6**, validasi **Joi**, autentikasi **JWT & bcryptjs**, serta dokumentasi interaktif **Swagger UI**.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime**: Node.js (>= 18), Express.js (CommonJS)
- **Database ORM**: Sequelize v6 (Mendukung `sqlite`, `mysql`, `postgres` via `.env`)
- **Autentikasi**: JSON Web Token (`jsonwebtoken`) + enkripsi `bcryptjs`
- **Validasi Data**: `joi`
- **Keamanan & Log**: `helmet`, `cors`, `morgan`, `express-rate-limit`
- **Dokumentasi API**: `swagger-ui-express` diakses di `/api-docs`

---

## 📁 Struktur Folder Project

Pola arsitektur layer terstruktur: `route → validator → controller → service → model`.

```
ivory-brew-api/
├── src/
│   ├── config/            # database.js, env.js (validasi joi), constants.js
│   ├── models/            # 1 file per tabel (16 tabel skema) + index.js (relasi/asosiasi)
│   ├── routes/            # 1 file per modul + index.js (agregator /api/v1)
│   ├── controllers/       # Layer tipis: terima request, panggil service, kirim response
│   ├── services/          # SEMUA logika bisnis transaksi DB (sequelize.transaction)
│   ├── validators/        # Skema validasi Joi per modul
│   ├── middlewares/       # auth.js, rbac.js, validate.js, errorHandler.js, notFound.js
│   ├── utils/             # response.js, AppError.js, asyncHandler.js, generators.js, pagination.js, unitConversion.js
│   ├── seeders/           # seed.js (data awal realistis kopi Indonesia, idempotent)
│   ├── scripts/           # syncDb.js (sinkronisasi tabel Sequelize)
│   ├── docs/              # swagger.js & spesifikasi API
│   ├── app.js             # Konfigurasi middleware Express
│   └── server.js          # Bootstrap server & koneksi database
├── docs/
│   └── requests.http      # Koleksi contoh request REST Client
├── .env.example           # Contoh variabel lingkungan
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Prasyarat
- Node.js versi 18 atau lebih baru
- npm

### 2. Langkah Cepat Menjalankan Server
```bash
# 1. Install dependensi
npm install

# 2. Siapkan file konfigurasi lingkungan
cp .env.example .env

# 3. Sinkronkan skema 16 tabel database
npm run db:sync

# 4. Masukkan data awal (seeder kopi Indonesia)
npm run seed

# 5. Jalankan server dalam mode development
npm run dev
```

Server akan aktif di: `http://localhost:5000`  
Dokumentasi interaktif Swagger: `http://localhost:5000/api-docs`

---

## 🔑 Akun Default Seeder

Password default untuk semua akun: `IvoryBrew123!` (dikonfigurasi pada `SEED_DEFAULT_PASSWORD`).

| Role | Email | Hak Akses Utama |
|---|---|---|
| **Manager** | `manager@ivorybrew.id` | Akses penuh seluruh sistem, user, role, audit, keuangan |
| **Barista** | `barista@ivorybrew.id` | Kasir POS, katalog produk, order transaksi, lihat shift |
| **Finance** | `finance@ivorybrew.id` | Purchasing bahan baku, pelunasan PO, pencatatan beban, laporan |
| **Supervisor** | `supervisor@ivorybrew.id` | Kasir POS, stok opname fisik, kelola shift, bahan baku |

---

## 🔄 Alur Bisnis Utama

### 1. Alur Transaksi Kasir (Checkout Order)
1. Kasir memilih produk dan kuantitas pesanan.
2. Server secara atomik (`sequelize.transaction`):
   - Menghitung `subtotal` = $\sum(\text{price} \times \text{qty})$.
   - Menghitung pajak restoran PB1 (10% default dari `TAX_RATE`) dari `subtotal - discount`.
   - Menghitung `total` dan uang kembalian `change`. Jika pembayaran cash dan uang kurang, transaksi ditolak.
   - **Pengurangan Stok Otomatis**:
     - Jika produk memiliki resep (`recipe_id`), bahan baku `raw_materials.current_stock` dikurangi sesuai takaran BOM $\times$ qty.
     - Jika produk reguler (non-resep), kurangi stok fisik `products.stock`.
     - Jika stok tidak mencukupi, transaksi dibatalkan dengan pesan error spesifik.
   - Mengambil `cashier_name` dari pengguna yang login dan memvalidasinya.
   - Membuat nomor struk urut harian otomatis: `IBC-YYYYMMDD-XXX`.
   - Menyimpan snapshot harga jual dan HPP ke `order_items`.

### 2. Pembatalan Transaksi (Cancel Order)
- Status diubah menjadi `cancelled`.
- Stok bahan baku maupun produk yang sebelumnya terpotong dikembalikan secara otomatis dalam transaksi database.

### 3. Pengadaan Bahan Baku (Purchase Order)
1. Dibuat dengan daftar item bahan baku, kuantitas, satuan, dan harga beli.
2. Server menghitung total biaya dan membuat nomor urut bulanan `PO-IBC-YYYYMM-XX`.
3. Stok bahan baku `raw_materials.current_stock` otomatis bertambah dan harga beli terakhir `unit_price` diperbarui.
4. **Otomasi Keuangan**:
   - Jika status `lunas`, otomatis dibuat entri `expenses` kategori `bahan-baku` dengan referensi `reference_po_id`.
   - Jika status `tempo`, `due_date` wajib diisi, dan expense baru akan terbentuk saat endpoint `PATCH /purchase-orders/:id/pay` dipanggil.

### 4. Stok Opname & Audit Inventaris
1. Auditor menginput kuantitas fisik aktual (`physical_stock`) untuk bahan baku atau produk jadi.
2. Server mengisi `system_stock` dari database, menghitung `difference = physical - system`, serta nilai kerugian / surplusnya.
3. Stok di database disesuaikan mengikuti hasil fisik aktual.
4. Menghasilkan nomor sesi `SOYYYYMMDD-XXX`.
5. Jika terjadi selisih minus (kerugian) dan setting `default_auto_expense` aktif pada `stock_opname_schedules`, sistem otomatis membuat entri `expenses` kategori `operasional` bertaut `reference_so_id`.
6. Pengingat audit (`/stock-opname/reminders`) mendeteksi jatuh tempo audit bulanan, mingguan, dan harian.

---

## ⚖️ Aturan Konversi Satuan

Sistem menyediakan utilitas konversi satuan (`src/utils/unitConversion.js`) yang menjembatani perbedaan satuan takaran resep sajian dengan satuan stok inventaris gudang:

| Komoditas / Satuan Resep | Satuan Stok Gudang | Aturan Konversi |
|---|---|---|
| **Gram (g)** | Kilogram (kg) | $1\text{ g} = 0.001\text{ kg}$ (dibagi 1000) |
| **Mililiter (ml)** | Liter | $1\text{ ml} = 0.001\text{ liter}$ (dibagi 1000) |
| **Sirup (pump)** | Liter | $1\text{ pump} = 10\text{ ml} = 0.01\text{ liter}$ |
| **Espresso (shot)** | Kilogram (kg) | $1\text{ shot} = 18\text{ g biji kopi} = 0.018\text{ kg}$ |
| **Kemasan (pcs)** | Pack | $1\text{ pack} = 50\text{ pcs}$ (atau 1:1 bila stok dalam pcs) |

---

## 📋 Ringkasan Endpoint API (Prefix `/api/v1`)

### Autentikasi
- `POST /auth/login` : Login akun & terima JWT token
- `GET /auth/me` : Ambil data profil pengguna yang login
- `POST /auth/logout` : Logout sesi

### Pengguna & Role
- `GET /users` : Daftar pengguna (pagination, search, filter)
- `POST /users` : Buat akun pengguna baru
- `GET /users/:id` : Detail pengguna
- `PUT /users/:id` : Perbarui akun pengguna
- `PATCH /users/:id/toggle-active` : Aktifkan / Nonaktifkan akun
- `DELETE /users/:id` : Hapus pengguna (hanya jika tanpa relasi)
- `GET /roles` : Daftar role & permissions
- `POST /roles` : Buat role baru
- `GET /roles/:code` : Detail role
- `PUT /roles/:code` : Perbarui role
- `DELETE /roles/:code` : Hapus role non-default
- `GET /roles/:code/permissions` : Daftar izin menu route role
- `PUT /roles/:code/permissions` : Simpan ulang izin menu route role

### Shift Barista
- `GET /shifts` : Daftar jadwal shift barista
- `POST /shifts` : Buat jadwal shift baru
- `GET /shifts/:id` : Detail jadwal shift
- `PUT /shifts/:id` : Perbarui jadwal shift
- `DELETE /shifts/:id` : Hapus jadwal shift

### Bahan Baku (Raw Materials)
- `GET /raw-materials/low-stock` : Daftar bahan baku menipis ($\le$ `min_stock_alert`)
- `GET /raw-materials` : Daftar inventaris bahan baku
- `POST /raw-materials` : Tambah bahan baku baru
- `GET /raw-materials/:id` : Detail bahan baku
- `PUT /raw-materials/:id` : Perbarui bahan baku
- `DELETE /raw-materials/:id` : Hapus bahan baku

### Resep (Bill of Materials)
- `GET /recipes` : Daftar resep minuman
- `POST /recipes` : Buat resep & item bahan baku baru (nested)
- `GET /recipes/:id` : Detail resep & kalkulasi HPP
- `PUT /recipes/:id` : Perbarui komposisi resep
- `POST /recipes/:id/recalculate-cost` : Hitung ulang HPP berdasarkan harga bahan baku terkini
- `DELETE /recipes/:id` : Hapus resep

### Produk Katalog
- `GET /products` : Daftar menu produk (`category`, `is_best_seller`)
- `POST /products` : Buat produk menu baru
- `GET /products/:id` : Detail produk
- `PUT /products/:id` : Perbarui produk
- `DELETE /products/:id` : Hapus produk

### Kasir & Transaksi
- `POST /orders` : Checkout kasir (PB1 10%, struk `IBC-YYYYMMDD-XXX`, potong stok)
- `GET /orders` : Riwayat order transaksi kasir
- `GET /orders/:id` : Detail transaksi & rincian item
- `PATCH /orders/:id/cancel` : Batalkan transaksi & pulihkan stok

### Pengadaan (Purchase Order)
- `GET /purchase-orders` : Daftar Purchase Order
- `POST /purchase-orders` : Buat PO (`PO-IBC-YYYYMM-XX`, tambah stok & catat expense)
- `GET /purchase-orders/:id` : Detail PO & rincian pengadaan
- `PATCH /purchase-orders/:id/pay` : Lunasi PO tempo & buat laporan pengeluaran
- `DELETE /purchase-orders/:id` : Hapus PO non-lunas

### Stok Opname & Audit
- `GET /stock-opname/reminders` : Cek status pengingat jadwal audit
- `GET /stock-opname/schedule` : Konfigurasi aktif jadwal stok opname
- `PUT /stock-opname/schedule` : Perbarui konfigurasi jadwal opname
- `POST /stock-opname/sessions` : Buat sesi opname (`SOYYYYMMDD-XXX`), sesuaikan stok & auto-expense
- `GET /stock-opname/sessions` : Riwayat sesi audit stok
- `GET /stock-opname/sessions/:id` : Detail audit fisik & selisih kuantitas/biaya

### Beban & Pengeluaran (Expenses)
- `GET /expenses` : Daftar catatan pengeluaran
- `POST /expenses` : Tambah catatan pengeluaran manual
- `GET /expenses/:id` : Detail pengeluaran
- `PUT /expenses/:id` : Perbarui catatan pengeluaran
- `DELETE /expenses/:id` : Hapus pengeluaran manual

### Laporan (Reports)
- `GET /reports/sales-summary?from=&to=` : Ringkasan penjualan & metode pembayaran
- `GET /reports/best-sellers?limit=10` : Produk terlaris berdasarkan volume & omset
- `GET /reports/profit-loss?from=&to=` : Laporan laba rugi bersih (Pendapatan - HPP - Beban)
- `GET /reports/cashflow?from=&to=` : Arus kas masuk & keluar terpilah kas/bank

### Utilitas
- `GET /health` : Cek kesiapan & uptime server
- `GET /api-docs` : Dokumentasi interaktif Swagger UI

---

## 🧪 Format Standar Response & Error

### Format Sukses:
```json
{
  "success": true,
  "message": "Operasi berhasil dilakukan",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Format Error:
```json
{
  "success": false,
  "message": "Validasi input gagal",
  "errors": [
    {
      "field": "items.0.quantity",
      "message": "quantity must be greater than 0"
    }
  ]
}
```
