/**
 * Database Seeder Ivory Brew Caffe (Idempotent)
 * Data Awal: 4 Roles + Permissions, Users, Raw Materials, Recipes, Products, Shifts, Opname Schedule
 */
const bcrypt = require('bcryptjs');
const {
  sequelize,
  Role,
  RoleMenuPermission,
  User,
  RawMaterial,
  Recipe,
  RecipeItem,
  Product,
  ShiftSchedule,
  StockOpnameSchedule,
} = require('../models');
const config = require('../config/env');
const { DEFAULT_ROLE_PERMISSIONS } = require('../config/constants');
const { convertRecipeQuantityToMaterialStock } = require('../utils/unitConversion');

const seedData = async () => {
  console.log('[Seed] Memulai seeding data awal Ivory Brew Caffe...');

  try {
    await sequelize.authenticate();

    // Pastikan skema tabel sudah ada
    await sequelize.sync();

    // 1. SEED ROLES & PERMISSIONS
    console.log('[Seed] 1. Menyiapkan Data Roles & Menu Permissions...');
    const rolesData = [
      {
        code: 'manager',
        name: 'General Manager',
        description: 'Akses penuh ke seluruh operasional, kasir, pembelian, dan keuangan',
        badge_color: 'amber',
        is_default: true,
      },
      {
        code: 'barista',
        name: 'Head & Junior Barista',
        description: 'Akses ke POS kasir, menu pesanan, dan monitoring stok bar',
        badge_color: 'emerald',
        is_default: true,
      },
      {
        code: 'finance',
        name: 'Finance & Purchasing Officer',
        description: 'Akses ke manajemen pengadaan supplier, pengeluaran kasir, dan laporan laba rugi',
        badge_color: 'blue',
        is_default: true,
      },
      {
        code: 'supervisor',
        name: 'Floor Supervisor',
        description: 'Akses ke POS kasir, stok opname, inventaris bahan baku, dan pengawasan shift',
        badge_color: 'purple',
        is_default: true,
      },
    ];

    for (const r of rolesData) {
      await Role.findOrCreate({
        where: { code: r.code },
        defaults: r,
      });

      // Seeding permissions
      const permissions = DEFAULT_ROLE_PERMISSIONS[r.code] || [];
      for (const route of permissions) {
        await RoleMenuPermission.findOrCreate({
          where: { role_code: r.code, allowed_route: route },
          defaults: { role_code: r.code, allowed_route: route },
        });
      }
    }

    // 2. SEED USERS
    console.log('[Seed] 2. Menyiapkan Data Pengguna (Users)...');
    const defaultPassword = config.seed.defaultPassword;

    const usersData = [
      {
        name: 'Budi Santoso',
        email: 'manager@ivorybrew.id',
        password: defaultPassword,
        role_code: 'manager',
        station: 'Head Office',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        is_active: true,
      },
      {
        name: 'Dimas Pratama',
        email: 'barista@ivorybrew.id',
        password: defaultPassword,
        role_code: 'barista',
        station: 'Espresso Bar 1',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        is_active: true,
      },
      {
        name: 'Siti Rahma',
        email: 'finance@ivorybrew.id',
        password: defaultPassword,
        role_code: 'finance',
        station: 'Finance & Admin Desk',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        is_active: true,
      },
      {
        name: 'Eko Prasetyo',
        email: 'supervisor@ivorybrew.id',
        password: defaultPassword,
        role_code: 'supervisor',
        station: 'Floor & Bar QC',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        is_active: true,
      },
    ];

    for (const u of usersData) {
      const existingUser = await User.findOne({ where: { email: u.email } });
      if (!existingUser) {
        await User.create(u);
      }
    }

    // 3. SEED RAW MATERIALS (± 12 Bahan Baku Kopi Indonesia & Pelengkap)
    console.log('[Seed] 3. Menyiapkan Data Bahan Baku (Raw Materials)...');
    const rawMaterialsData = [
      {
        name: 'Biji Kopi Arabika Gayo Aceh',
        category: 'Bahan Kopi',
        current_stock: 25.0,
        unit: 'kg',
        min_stock_alert: 5.0,
        unit_price: 135000,
        supplier: 'CV Kopi Nusantara Mandiri',
      },
      {
        name: 'Biji Kopi Robusta Temanggung Fine',
        category: 'Bahan Kopi',
        current_stock: 30.0,
        unit: 'kg',
        min_stock_alert: 6.0,
        unit_price: 85000,
        supplier: 'Petani Kopi Temanggung',
      },
      {
        name: 'Susu Segar Pasteurisasi Greenfields',
        category: 'Dairy',
        current_stock: 50.0,
        unit: 'liter',
        min_stock_alert: 10.0,
        unit_price: 24000,
        supplier: 'PT Segar Utama Sentosa',
      },
      {
        name: 'Oat Milk Barista Edition (Oatside)',
        category: 'Dairy',
        current_stock: 20.0,
        unit: 'liter',
        min_stock_alert: 4.0,
        unit_price: 38000,
        supplier: 'Distributor Nabati Jakarta',
      },
      {
        name: 'Gula Aren Cair Organik Premium',
        category: 'Sirup',
        current_stock: 15.0,
        unit: 'liter',
        min_stock_alert: 3.0,
        unit_price: 35000,
        supplier: 'Aren Asli Priangan',
      },
      {
        name: 'Sirup Karamel Monin',
        category: 'Sirup',
        current_stock: 6.0,
        unit: 'liter',
        min_stock_alert: 1.5,
        unit_price: 160000,
        supplier: 'PT Beverage Supplies',
      },
      {
        name: 'Sirup Vanilla Monin',
        category: 'Sirup',
        current_stock: 5.0,
        unit: 'liter',
        min_stock_alert: 1.5,
        unit_price: 160000,
        supplier: 'PT Beverage Supplies',
      },
      {
        name: 'Bubuk Matcha Asli Kyoto Uji',
        category: 'Bahan Kopi',
        current_stock: 5.0,
        unit: 'kg',
        min_stock_alert: 1.0,
        unit_price: 320000,
        supplier: 'PT Sukses Teh Impor',
      },
      {
        name: 'Bubuk Java Dark Cocoa 70%',
        category: 'Bahan Kopi',
        current_stock: 8.0,
        unit: 'kg',
        min_stock_alert: 2.0,
        unit_price: 110000,
        supplier: 'Kakao Sejahtera Jember',
      },
      {
        name: 'Cup Plastik Dingin PET 16oz + Logo',
        category: 'Cup',
        current_stock: 1000,
        unit: 'pcs',
        min_stock_alert: 200,
        unit_price: 850,
        supplier: 'CV Plastik Kemasan Prima',
      },
      {
        name: 'Cup Kertas Panas Hot Cup 8oz',
        category: 'Cup',
        current_stock: 500,
        unit: 'pcs',
        min_stock_alert: 100,
        unit_price: 650,
        supplier: 'CV Plastik Kemasan Prima',
      },
      {
        name: 'Sedotan Bio & Tutup Dome / Flat',
        category: 'Cup',
        current_stock: 1200,
        unit: 'pcs',
        min_stock_alert: 250,
        unit_price: 250,
        supplier: 'CV Plastik Kemasan Prima',
      },
    ];

    const materialMap = new Map();
    for (const mat of rawMaterialsData) {
      let [record] = await RawMaterial.findOrCreate({
        where: { name: mat.name },
        defaults: mat,
      });
      materialMap.set(mat.name, record);
    }

    // Helper get material ID & price
    const getMat = (name) => materialMap.get(name);

    // 4. SEED RECIPES & RECIPE ITEMS (± 8 Resep Populer)
    console.log('[Seed] 4. Menyiapkan Resep & Komposisi BOM...');
    const recipesDefinitions = [
      {
        name: 'Espresso Double Shot',
        category: 'espresso',
        description: 'Ekstraksi 36g espresso pekat menggunakan biji kopi Gayo Aceh',
        serving_size: '60 ml',
        items: [
          { mat: 'Biji Kopi Arabika Gayo Aceh', qty: 18, unit: 'g' },
          { mat: 'Cup Kertas Panas Hot Cup 8oz', qty: 1, unit: 'pcs' },
        ],
      },
      {
        name: 'Americano Dingin Gayo',
        category: 'espresso',
        description: 'Double shot espresso dipadukan air mineral dan es batu kristal',
        serving_size: '350 ml',
        items: [
          { mat: 'Biji Kopi Arabika Gayo Aceh', qty: 18, unit: 'g' },
          { mat: 'Cup Plastik Dingin PET 16oz + Logo', qty: 1, unit: 'pcs' },
          { mat: 'Sedotan Bio & Tutup Dome / Flat', qty: 1, unit: 'pcs' },
        ],
      },
      {
        name: 'Ivory Cafe Latte',
        category: 'espresso',
        description: 'Espresso harum berpadu susu segar pasteurisasi Greenfields yang creamy',
        serving_size: '350 ml',
        items: [
          { mat: 'Biji Kopi Arabika Gayo Aceh', qty: 18, unit: 'g' },
          { mat: 'Susu Segar Pasteurisasi Greenfields', qty: 180, unit: 'ml' },
          { mat: 'Cup Plastik Dingin PET 16oz + Logo', qty: 1, unit: 'pcs' },
          { mat: 'Sedotan Bio & Tutup Dome / Flat', qty: 1, unit: 'pcs' },
        ],
      },
      {
        name: 'Kopi Susu Aren Ivory (Signature)',
        category: 'signature',
        description: 'Menu andalan Ivory Brew perpaduan kopi espresso, susu segar, dan gula aren organik',
        serving_size: '350 ml',
        items: [
          { mat: 'Biji Kopi Robusta Temanggung Fine', qty: 18, unit: 'g' },
          { mat: 'Susu Segar Pasteurisasi Greenfields', qty: 160, unit: 'ml' },
          { mat: 'Gula Aren Cair Organik Premium', qty: 25, unit: 'ml' },
          { mat: 'Cup Plastik Dingin PET 16oz + Logo', qty: 1, unit: 'pcs' },
          { mat: 'Sedotan Bio & Tutup Dome / Flat', qty: 1, unit: 'pcs' },
        ],
      },
      {
        name: 'Caramel Macchiato',
        category: 'signature',
        description: 'Espresso dengan sirup vanilla, susu creamy dan siraman saus karamel lezat',
        serving_size: '350 ml',
        items: [
          { mat: 'Biji Kopi Arabika Gayo Aceh', qty: 18, unit: 'g' },
          { mat: 'Susu Segar Pasteurisasi Greenfields', qty: 160, unit: 'ml' },
          { mat: 'Sirup Karamel Monin', qty: 2, unit: 'pump' }, // 20 ml
          { mat: 'Sirup Vanilla Monin', qty: 1, unit: 'pump' },  // 10 ml
          { mat: 'Cup Plastik Dingin PET 16oz + Logo', qty: 1, unit: 'pcs' },
          { mat: 'Sedotan Bio & Tutup Dome / Flat', qty: 1, unit: 'pcs' },
        ],
      },
      {
        name: 'Matcha Oat Latte',
        category: 'signature',
        description: 'Bubuk matcha murni Kyoto dipadukan dengan kelezatan susu oat nabati ramah laktosa',
        serving_size: '350 ml',
        items: [
          { mat: 'Bubuk Matcha Asli Kyoto Uji', qty: 12, unit: 'g' },
          { mat: 'Oat Milk Barista Edition (Oatside)', qty: 180, unit: 'ml' },
          { mat: 'Gula Aren Cair Organik Premium', qty: 15, unit: 'ml' },
          { mat: 'Cup Plastik Dingin PET 16oz + Logo', qty: 1, unit: 'pcs' },
          { mat: 'Sedotan Bio & Tutup Dome / Flat', qty: 1, unit: 'pcs' },
        ],
      },
      {
        name: 'Java Dark Chocolate Iced',
        category: 'signature',
        description: 'Cokelat asli Jawa pekat 70% dengan susu segar bertekstur lembut',
        serving_size: '350 ml',
        items: [
          { mat: 'Bubuk Java Dark Cocoa 70%', qty: 25, unit: 'g' },
          { mat: 'Susu Segar Pasteurisasi Greenfields', qty: 180, unit: 'ml' },
          { mat: 'Cup Plastik Dingin PET 16oz + Logo', qty: 1, unit: 'pcs' },
          { mat: 'Sedotan Bio & Tutup Dome / Flat', qty: 1, unit: 'pcs' },
        ],
      },
      {
        name: 'Manual Brew V60 Aceh Gayo',
        category: 'manualbrew',
        description: 'Seduhan manual filter V60 dengan aroma fruity dan keasaman manis segar',
        serving_size: '220 ml',
        items: [
          { mat: 'Biji Kopi Arabika Gayo Aceh', qty: 15, unit: 'g' },
          { mat: 'Cup Kertas Panas Hot Cup 8oz', qty: 1, unit: 'pcs' },
        ],
      },
    ];

    const recipeMap = new Map();

    for (const rDef of recipesDefinitions) {
      let recipe = await Recipe.findOne({ where: { name: rDef.name } });

      // Hitung estimated_cost
      let estimatedCost = 0;
      for (const it of rDef.items) {
        const m = getMat(it.mat);
        const stockQty = convertRecipeQuantityToMaterialStock(it.qty, it.unit, m.unit);
        estimatedCost += stockQty * Number(m.unit_price);
      }
      estimatedCost = Number(estimatedCost.toFixed(2));

      if (!recipe) {
        recipe = await Recipe.create({
          name: rDef.name,
          category: rDef.category,
          description: rDef.description,
          serving_size: rDef.serving_size,
          estimated_cost: estimatedCost,
          updated_at: new Date(),
        });

        for (const it of rDef.items) {
          const m = getMat(it.mat);
          await RecipeItem.create({
            recipe_id: recipe.id,
            material_id: m.id,
            quantity: it.qty,
            unit: it.unit,
          });
        }
      } else {
        recipe.estimated_cost = estimatedCost;
        recipe.updated_at = new Date();
        await recipe.save();
      }

      recipeMap.set(rDef.name, recipe);
    }

    // 5. SEED PRODUCTS (± 10 Produk: 8 Berdasarkan Resep + 2 Pastry Reguler Non-Resep)
    console.log('[Seed] 5. Menyiapkan Menu Produk Katalog...');
    const productsData = [
      {
        name: 'Espresso Double Shot',
        category: 'espresso',
        price: 20000,
        recipe_name: 'Espresso Double Shot',
        image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400',
        stock: 999, // dummy, stok dihitung dari bahan baku
        description: 'Single origin Aceh Gayo extraction',
        is_best_seller: false,
      },
      {
        name: 'Americano Dingin Gayo',
        category: 'espresso',
        price: 25000,
        recipe_name: 'Americano Dingin Gayo',
        image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400',
        stock: 999,
        description: 'Segar dan nikmat tanpa gula',
        is_best_seller: true,
      },
      {
        name: 'Ivory Cafe Latte',
        category: 'espresso',
        price: 32000,
        recipe_name: 'Ivory Cafe Latte',
        image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400',
        stock: 999,
        description: 'Creamy latte lembut',
        is_best_seller: true,
      },
      {
        name: 'Kopi Susu Aren Ivory',
        category: 'signature',
        price: 28000,
        recipe_name: 'Kopi Susu Aren Ivory (Signature)',
        image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
        stock: 999,
        description: 'Best seller kopi susu khas Ivory Brew',
        is_best_seller: true,
      },
      {
        name: 'Caramel Macchiato',
        category: 'signature',
        price: 38000,
        recipe_name: 'Caramel Macchiato',
        image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400',
        stock: 999,
        description: 'Perpaduan vanilla dan lelehan saus karamel',
        is_best_seller: true,
      },
      {
        name: 'Matcha Oat Latte',
        category: 'signature',
        price: 36000,
        recipe_name: 'Matcha Oat Latte',
        image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400',
        stock: 999,
        description: 'Uji matcha Jepang dengan susu gandum sehat',
        is_best_seller: false,
      },
      {
        name: 'Java Dark Chocolate Iced',
        category: 'signature',
        price: 32000,
        recipe_name: 'Java Dark Chocolate Iced',
        image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400',
        stock: 999,
        description: 'Cokelat murni Jawa pekat dan tidak terlalu manis',
        is_best_seller: false,
      },
      {
        name: 'Manual Brew V60 Gayo',
        category: 'manualbrew',
        price: 30000,
        recipe_name: 'Manual Brew V60 Aceh Gayo',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
        stock: 999,
        description: 'Pour over seduh tangan barista bersertifikat',
        is_best_seller: false,
      },
      // 2 Produk Pastry Non-Resep (Pengurangan Stok Produk Langsung)
      {
        name: 'Butter Croissant Premium',
        category: 'pastry',
        price: 26000,
        recipe_name: null,
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
        stock: 25,
        cost_price: 13000,
        description: 'Freshly baked butter croissant renyah dari oven',
        is_best_seller: true,
      },
      {
        name: 'Fudgy Brownies Almond Slice',
        category: 'pastry',
        price: 24000,
        recipe_name: null,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
        stock: 20,
        cost_price: 11000,
        description: 'Brownies cokelat lumer bertabur kacang almond',
        is_best_seller: false,
      },
    ];

    for (const p of productsData) {
      let recipeId = null;
      let costPrice = p.cost_price || 0;

      if (p.recipe_name && recipeMap.has(p.recipe_name)) {
        const rec = recipeMap.get(p.recipe_name);
        recipeId = rec.id;
        costPrice = rec.estimated_cost;
      }

      await Product.findOrCreate({
        where: { name: p.name },
        defaults: {
          name: p.name,
          category: p.category,
          price: p.price,
          cost_price: costPrice,
          recipe_id: recipeId,
          image: p.image,
          stock: p.stock,
          description: p.description,
          is_best_seller: p.is_best_seller,
        },
      });
    }

    // 6. SEED SHIFT SCHEDULES
    console.log('[Seed] 6. Menyiapkan Jadwal Shift Barista...');
    const shiftsData = [
      {
        name: 'Shift Pagi (Opening)',
        start_time: '07:30',
        end_time: '15:30',
        barista_name: 'Dimas Pratama',
        station: 'Espresso Bar 1',
        days_active: 'Senin, Selasa, Rabu, Kamis, Jumat',
        is_active: true,
        notes: 'Briefing pagi, kalibrasi grinder, dan pengecekan stok harian',
      },
      {
        name: 'Shift Siang-Malam (Closing)',
        start_time: '15:00',
        end_time: '23:00',
        barista_name: 'Dimas Pratama',
        station: 'Bar & Cashier',
        days_active: 'Sabtu, Minggu',
        is_active: true,
        notes: 'Backflush mesin kopi, sanitasi meja bar, dan closing settlement',
      },
    ];

    for (const s of shiftsData) {
      await ShiftSchedule.findOrCreate({
        where: { name: s.name },
        defaults: s,
      });
    }

    // 7. SEED STOCK OPNAME SCHEDULE
    console.log('[Seed] 7. Menyiapkan Pengaturan Jadwal Stok Opname...');
    await StockOpnameSchedule.findOrCreate({
      where: { primary_cadence: 'monthly' },
      defaults: {
        primary_cadence: 'monthly',
        daily_enabled: false,
        daily_target_time: '21:30',
        weekly_enabled: false,
        weekly_day: 0,
        monthly_enabled: true,
        monthly_day: 28,
        monthly_reminder_days: 3,
        default_scope: 'all',
        default_auto_expense: true,
      },
    });

    console.log('==================================================');
    console.log('✅ SEEDING DATA AWAL BERHASIL LENGKAP & IDEMPOTENT!');
    console.log('Akun default yang dapat digunakan untuk login:');
    console.log(`- Manager    : manager@ivorybrew.id / ${config.seed.defaultPassword}`);
    console.log(`- Barista    : barista@ivorybrew.id / ${config.seed.defaultPassword}`);
    console.log(`- Finance    : finance@ivorybrew.id / ${config.seed.defaultPassword}`);
    console.log(`- Supervisor : supervisor@ivorybrew.id / ${config.seed.defaultPassword}`);
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Terjadi kesalahan saat seeding:', error);
    process.exit(1);
  }
};

seedData();
