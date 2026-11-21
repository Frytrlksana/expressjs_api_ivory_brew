/**
 * Konfigurasi Aplikasi Express Ivory Brew Caffe API
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const routes = require('./routes');
const { setupSwagger } = require('./docs/swagger');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');

const app = express();

// 1. Keamanan Header HTTP
app.use(helmet());

// 2. CORS Handling
app.use(
  cors({
    origin: config.cors.origin === '*' ? true : config.cors.origin,
    credentials: true,
  })
);

// 3. HTTP Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// 4. Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Rate Limiter untuk Endpoint API
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  skip: () => config.nodeEnv === 'development',
  message: {
    success: false,
    message: 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(config.apiPrefix, limiter);

// 6. Dokumentasi API Swagger di /api-docs
setupSwagger(app);

// 7. Route Index Root
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Selamat datang di Ivory Brew Caffe REST API Service',
    documentation: '/api-docs',
    version: '1.0.0',
  });
});

// 8. Pendaftaran Rute Utama (/api/v1)
app.use(config.apiPrefix, routes);

// 9. 404 Handler untuk rute tak dikenal
app.use(notFound);

// 10. Global Error Handling Middleware
app.use(errorHandler);

module.exports = app;
