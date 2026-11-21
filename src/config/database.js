/**
 * Inisialisasi Koneksi Database Sequelize v6
 */
const { Sequelize } = require('sequelize');
const path = require('path');
const config = require('./env');

let sequelize;

if (config.db.dialect === 'sqlite') {
  const storagePath = path.isAbsolute(config.db.storage)
    ? config.db.storage
    : path.resolve(__dirname, '../../', config.db.storage);

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: config.db.logging,
    define: {
      underscored: true,
      timestamps: false,
    },
  });
} else {
  sequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    {
      host: config.db.host,
      port: config.db.port,
      dialect: config.db.dialect,
      logging: config.db.logging,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        underscored: true,
        timestamps: false,
      },
    }
  );
}

/**
 * Menguji koneksi database
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`[DB] Berhasil terhubung ke database (${config.db.dialect}).`);
  } catch (error) {
    console.error('[DB] Gagal terhubung ke database:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
};
