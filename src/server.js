/**
 * Bootstrap Server & Koneksi Database
 */
const app = require('./app');
const config = require('./config/env');
const { testConnection } = require('./config/database');

const startServer = async () => {
  try {
    // 1. Uji koneksi ke database
    await testConnection();

    // 2. Start HTTP Server
    const server = app.listen(config.port, () => {
      console.log('==================================================');
      console.log(`☕ IVORY BREW CAFFE REST API BERJALAN`);
      console.log(`🌍 Lingkungan : ${config.nodeEnv}`);
      console.log(`🚀 Port       : ${config.port}`);
      console.log(`📑 API Docs   : http://localhost:${config.port}/api-docs`);
      console.log(`🔗 Base URL   : http://localhost:${config.port}${config.apiPrefix}`);
      console.log('==================================================');
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('\n[Server] Menutup server gracefully...');
      server.close(() => {
        console.log('[Server] Server HTTP ditutup.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[Server] Gagal menjalankan server:', error);
    process.exit(1);
  }
};

startServer();
