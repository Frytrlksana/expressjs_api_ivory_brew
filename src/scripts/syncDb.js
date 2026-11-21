/**
 * Script Sinkronisasi Skema Database Sequelize
 */
const { sequelize } = require('../models');
const config = require('../config/env');

const syncDatabase = async () => {
  try {
    console.log(`[DB Sync] Memulai sinkronisasi database (${config.db.dialect})...`);
    await sequelize.authenticate();

    // Di development gunakan alter agar kolom/tabel baru terbentuk tanpa drop data
    const isDev = config.nodeEnv === 'development';
    await sequelize.sync({ alter: isDev });

    console.log('[DB Sync] Skema 16 tabel berhasil disinkronkan ke database!');
    process.exit(0);
  } catch (error) {
    console.error('[DB Sync] Gagal melakukan sinkronisasi database:', error);
    process.exit(1);
  }
};

syncDatabase();
