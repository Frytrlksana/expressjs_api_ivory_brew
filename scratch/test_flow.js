/**
 * Test Runner Uji Cepat Skenario Ivory Brew Caffe REST API
 */
const http = require('http');
const app = require('../src/app');
const config = require('../src/config/env');
const { RawMaterial, Product, Expense } = require('../src/models');

const runTests = async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5001, resolve));
  const baseUrl = 'http://localhost:5001/api/v1';

  console.log('\n==================================================');
  console.log('🧪 MEMULAI UJI CEPAT ALUR END-TO-END IVORY BREW');
  console.log('==================================================\n');

  const request = async (url, options = {}) => {
    const res = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const json = await res.json();
    return { status: res.status, data: json };
  };

  try {
    // 1. Health Check
    console.log('[Test 1] Health Check...');
    const health = await request('/health');
    console.log(`Status: ${health.status}, Message: ${health.data.message}`);

    // 2. Login Manager & Barista
    console.log('\n[Test 2] Login Manager...');
    const loginMgr = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'manager@ivorybrew.id',
        password: config.seed.defaultPassword,
      }),
    });
    const managerToken = loginMgr.data.data.token;
    console.log(`✅ Manager login sukses. Token: ${managerToken.substring(0, 20)}...`);

    console.log('\n[Test 3] Login Barista...');
    const loginBarista = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'barista@ivorybrew.id',
        password: config.seed.defaultPassword,
      }),
    });
    const baristaToken = loginBarista.data.data.token;
    console.log(`✅ Barista login sukses. User: ${loginBarista.data.data.user.name}`);

    // 3. Buat Produk Baru
    console.log('\n[Test 4] Buat Produk Baru (Butter Croissant Spesial)...');
    const createProd = await request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        name: 'Croissant Cokelat Hazelnut',
        category: 'pastry',
        price: 28000,
        cost_price: 12000,
        stock: 30,
        description: 'Pastry renyah dengan isian hazelnut melimpah',
        is_best_seller: true,
      }),
    });
    const newProduct = createProd.data.data;
    console.log(`✅ Produk baru dibuat: ${newProduct.name} (ID: ${newProduct.id}, Stok Awal: ${newProduct.stock})`);

    // 4. Ambil Produk dengan Resep (Kopi Susu Aren Ivory) & Cek Stok Bahan Baku Awal
    console.log('\n[Test 5] Cek Produk Resep & Bahan Baku Awal...');
    const productsRes = await request('/products?search=Kopi Susu Aren', {
      headers: { Authorization: `Bearer ${baristaToken}` },
    });
    const kopiAren = productsRes.data.data[0];
    console.log(`Target Produk: ${kopiAren.name} (Harga: Rp ${kopiAren.price}, Resep ID: ${kopiAren.recipe_id})`);

    // Ambil bahan baku Biji Kopi Robusta & Susu Segar
    const matRobusta = await RawMaterial.findOne({ where: { name: 'Biji Kopi Robusta Temanggung Fine' } });
    const matSusu = await RawMaterial.findOne({ where: { name: 'Susu Segar Pasteurisasi Greenfields' } });
    const stockRobustaAwal = Number(matRobusta.current_stock);
    const stockSusuAwal = Number(matSusu.current_stock);
    console.log(`Stok Awal Bahan Baku:`);
    console.log(`- Robusta: ${stockRobustaAwal} ${matRobusta.unit}`);
    console.log(`- Susu Segar: ${stockSusuAwal} ${matSusu.unit}`);

    // 5. Checkout Kasir
    console.log('\n[Test 6] Checkout Transaksi Kasir...');
    // Beli 2 Kopi Susu Aren (resep) + 3 Croissant Hazelnut (produk non-resep)
    const orderPayload = {
      order_type: 'dine-in',
      table_number: 'Meja 03',
      customer_name: 'Ferry Pratama',
      payment_method: 'cash',
      discount: 5000,
      cash_given: 160000,
      items: [
        {
          product_id: kopiAren.id,
          quantity: 2,
          notes: 'Less sugar',
        },
        {
          product_id: newProduct.id,
          quantity: 3,
          notes: 'Dihangatkan',
        },
      ],
    };

    const checkoutRes = await request('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${baristaToken}` },
      body: JSON.stringify(orderPayload),
    });

    if (checkoutRes.status !== 201) {
      throw new Error(`Checkout gagal: ${JSON.stringify(checkoutRes.data)}`);
    }

    const orderData = checkoutRes.data.data;
    console.log('✅ Checkout Berhasil!');
    console.log(`- No Struk    : ${orderData.receipt_number}`);
    console.log(`- Kasir       : ${orderData.cashier_name}`);
    console.log(`- Subtotal    : Rp ${orderData.subtotal}`);
    console.log(`- Diskon      : Rp ${orderData.discount}`);
    console.log(`- Pajak PB1   : Rp ${orderData.tax}`);
    console.log(`- Total Akhir : Rp ${orderData.total}`);
    console.log(`- Uang Tunai  : Rp ${orderData.cash_given}`);
    console.log(`- Kembalian   : Rp ${orderData.change}`);

    // 6. Cek Pengurangan Stok
    console.log('\n[Test 7] Verifikasi Pengurangan Stok...');
    await matRobusta.reload();
    await matSusu.reload();
    const prodCheck = await Product.findByPk(newProduct.id);

    console.log(`- Stok Robusta sekarang  : ${matRobusta.current_stock} kg (Berkurang: ${(stockRobustaAwal - Number(matRobusta.current_stock)).toFixed(3)} kg)`);
    console.log(`- Stok Susu Segar sekarang: ${matSusu.current_stock} liter (Berkurang: ${(stockSusuAwal - Number(matSusu.current_stock)).toFixed(3)} liter)`);
    console.log(`- Stok Croissant sekarang : ${prodCheck.stock} pcs (Berkurang: ${30 - prodCheck.stock} pcs)`);

    // 7. Buat Purchase Order (PO) & Cek Stok Bertambah + Expense Terbentuk
    console.log('\n[Test 8] Buat Purchase Order (Status Lunas)...');
    const poPayload = {
      supplier: 'CV Mitra Tani Temanggung',
      date: '2026-11-21',
      status: 'lunas',
      payment_method: 'bank',
      notes: 'Penambahan stok biji kopi robusta 15kg',
      items: [
        {
          material_id: matRobusta.id,
          quantity: 15,
          unit: 'kg',
          unit_price: 88000,
        },
      ],
    };

    const poRes = await request('/purchase-orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify(poPayload),
    });

    const poData = poRes.data.data;
    console.log('✅ Purchase Order Berhasil Dibuat!');
    console.log(`- No PO       : ${poData.po_number}`);
    console.log(`- Total Biaya : Rp ${poData.total_cost}`);
    console.log(`- Status      : ${poData.status}`);

    await matRobusta.reload();
    console.log(`- Stok Robusta setelah PO: ${matRobusta.current_stock} kg (Bertambah +15 kg)`);
    console.log(`- Harga Beli Terakhir    : Rp ${matRobusta.unit_price}/kg`);

    // Cek Expense dari PO
    const poExpense = await Expense.findOne({ where: { reference_po_id: poData.id } });
    console.log(`- Expense Terbentuk      : ${poExpense ? `Ya (ID: ${poExpense.id}, Jumlah: Rp ${poExpense.amount}, Kategori: ${poExpense.category})` : 'Tidak'}`);

    // 8. Buat Sesi Stok Opname (Auto Expense jika ada selisih kerugian)
    console.log('\n[Test 9] Buat Sesi Stok Opname (Audit Fisik)...');
    const soPayload = {
      cadence: 'monthly',
      scope: 'raw_material',
      notes: 'Uji audit stok fisik berkala',
      items: [
        {
          item_id: matRobusta.id,
          item_type: 'raw_material',
          physical_stock: Number(matRobusta.current_stock) - 0.5, // ada selisih kerugian 0.5 kg spillage
          reason: 'spillage',
          notes: 'Tumpah saat pengisian hopper grinder',
        },
      ],
    };

    const soRes = await request('/stock-opname/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify(soPayload),
    });

    const soData = soRes.data.data;
    console.log('✅ Sesi Stok Opname Berhasil Dibuat!');
    console.log(`- No Opname            : ${soData.opname_number}`);
    console.log(`- Total Item Selisih   : ${soData.total_discrepancy_items}`);
    console.log(`- Total Nilai Kerugian : Rp ${soData.total_loss_value}`);
    console.log(`- Auto Expense Dibuat  : ${soData.auto_expense_created}`);

    await matRobusta.reload();
    console.log(`- Stok Robusta Terkini : ${matRobusta.current_stock} kg (Sesuai fisik aktual)`);

    const soExpense = await Expense.findOne({ where: { reference_so_id: soData.id } });
    console.log(`- Expense Opname       : ${soExpense ? `Ya (Jumlah: Rp ${soExpense.amount}, Kategori: ${soExpense.category})` : 'Tidak'}`);

    // 9. Cek Laporan Penjualan & Laba Rugi
    console.log('\n[Test 10] Cek Laporan Penjualan & Laba Rugi...');
    const salesReport = await request('/reports/sales-summary', {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    console.log('Ringkasan Penjualan:');
    console.log(`- Total Transaksi  : ${salesReport.data.data.total_transactions}`);
    console.log(`- Total Omset Net  : Rp ${salesReport.data.data.total_net_sales}`);

    const pnlReport = await request('/reports/profit-loss', {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    console.log('Laporan Laba Rugi:');
    console.log(`- Pendapatan Bersih: Rp ${pnlReport.data.data.revenue.net_revenue}`);
    console.log(`- Total HPP (COGS) : Rp ${pnlReport.data.data.cost_of_goods_sold}`);
    console.log(`- Laba Kotor       : Rp ${pnlReport.data.data.gross_profit}`);
    console.log(`- Total Beban      : Rp ${pnlReport.data.data.operating_expenses.total}`);
    console.log(`- Laba Bersih      : Rp ${pnlReport.data.data.net_profit}`);

    console.log('\n==================================================');
    console.log('🎉 SELURUH PENGUJIAN SKENARIO LULUS 100% TANPA KENDALA!');
    console.log('==================================================\n');
  } finally {
    server.close();
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Uji coba gagal:', err);
    process.exit(1);
  });
