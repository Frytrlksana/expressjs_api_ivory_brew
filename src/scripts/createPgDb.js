/**
 * Script Otomatis Pembuat Database PostgreSQL (Jika Belum Ada)
 */
const { Client } = require('pg');
const config = require('../config/env');

const createDatabaseIfNotExists = async () => {
  if (config.db.dialect !== 'postgres') {
    console.log(`[DB Create] Dialect saat ini adalah ${config.db.dialect}, melewati pembuatan database postgres.`);
    return;
  }

  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: 'postgres', // Terhubung ke database default postgres
  });

  try {
    console.log(`[DB Create] Menghubungkan ke PostgreSQL (${config.db.host}:${config.db.port}) sebagai user '${config.db.user}'...`);
    await client.connect();

    // Periksa apakah database target sudah ada
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.db.name]
    );

    if (res.rowCount === 0) {
      console.log(`[DB Create] Database '${config.db.name}' belum ada. Membuat database baru...`);
      await client.query(`CREATE DATABASE "${config.db.name}"`);
      console.log(`[DB Create] Database '${config.db.name}' berhasil dibuat! 🎉`);
    } else {
      console.log(`[DB Create] Database '${config.db.name}' sudah tersedia.`);
    }

    await client.end();
  } catch (error) {
    console.error('[DB Create] Catatan Koneksi PostgreSQL:', error.message);
    console.log('[DB Create] Tips: Pastikan service PostgreSQL Anda sedang berjalan di localhost:5432.');
    console.log('[DB Create] Jika password berbeda, sesuaikan DB_PASSWORD di file .env.');
    try {
      await client.end();
    } catch (_) {}
  }
};

createDatabaseIfNotExists();
