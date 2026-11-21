/**
 * Konfigurasi Swagger UI API Documentation
 */
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Ivory Brew Caffe REST API',
    version: '1.0.0',
    description:
      'Backend REST API untuk sistem Kasir POS, Manajemen Resep/BOM, Pengadaan Bahan Baku, Stok Opname, Keuangan, dan Pengguna Multi-Role Ivory Brew Caffe.',
    contact: {
      name: 'Ivory Brew Engineering Team',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Endpoint',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan token JWT hasil login dengan format: Bearer <token>',
      },
    },
    schemas: {
      StandardSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operasi berhasil dilakukan' },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 50 },
              totalPages: { type: 'integer', example: 5 },
            },
          },
        },
      },
      StandardErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Pesan kesalahan' },
          errors: {
            type: 'array',
            items: { type: 'object' },
            example: [],
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'manager@ivorybrew.id' },
          password: { type: 'string', example: 'IvoryBrew123!' },
        },
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['order_type', 'payment_method', 'items'],
        properties: {
          order_type: { type: 'string', enum: ['dine-in', 'takeaway', 'delivery'], example: 'dine-in' },
          table_number: { type: 'string', example: 'Meja 05' },
          customer_name: { type: 'string', example: 'Budi Santoso' },
          payment_method: { type: 'string', enum: ['cash', 'qris', 'card'], example: 'cash' },
          discount: { type: 'number', example: 5000 },
          cash_given: { type: 'number', example: 100000 },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['product_id', 'quantity'],
              properties: {
                product_id: { type: 'string', example: 'c0a80123-0000-0000-0000-000000000001' },
                quantity: { type: 'integer', example: 2 },
                notes: { type: 'string', example: 'Less ice, oat milk' },
              },
            },
          },
        },
      },
      CreatePoRequest: {
        type: 'object',
        required: ['supplier', 'date', 'status', 'payment_method', 'items'],
        properties: {
          supplier: { type: 'string', example: 'PT Kopi Nusantara Abadi' },
          date: { type: 'string', format: 'date', example: '2026-11-21' },
          status: { type: 'string', enum: ['lunas', 'tempo'], example: 'lunas' },
          payment_method: { type: 'string', enum: ['kas', 'bank'], example: 'bank' },
          due_date: { type: 'string', format: 'date', example: '2026-12-05' },
          notes: { type: 'string', example: 'Restock biji kopi arabika & susu' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['material_id', 'quantity', 'unit', 'unit_price'],
              properties: {
                material_id: { type: 'string' },
                quantity: { type: 'number', example: 10 },
                unit: { type: 'string', example: 'kg' },
                unit_price: { type: 'number', example: 125000 },
              },
            },
          },
        },
      },
      CreateOpnameSessionRequest: {
        type: 'object',
        required: ['cadence', 'scope', 'items'],
        properties: {
          cadence: { type: 'string', enum: ['monthly', 'weekly', 'daily', 'ad_hoc'], example: 'monthly' },
          scope: { type: 'string', enum: ['all', 'perishable', 'raw_material', 'product'], example: 'all' },
          notes: { type: 'string', example: 'Audit stok akhir bulan' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['item_id', 'item_type', 'physical_stock', 'reason'],
              properties: {
                item_id: { type: 'string' },
                item_type: { type: 'string', enum: ['raw_material', 'product'], example: 'raw_material' },
                physical_stock: { type: 'number', example: 18.5 },
                reason: { type: 'string', example: 'calibration' },
                notes: { type: 'string', example: 'Penyesuaian kalibrasi mesin grinder' },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Pengecekan status server API',
        security: [],
        responses: {
          200: { description: 'Server aktif dan sehat' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login pengguna & dapatkan Bearer JWT token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Login berhasil' },
          401: { description: 'Kredensial tidak valid' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Ambil profil data pengguna yang sedang login',
        responses: {
          200: { description: 'Profil pengguna berhasil didapatkan' },
        },
      },
    },
    '/products': {
      get: {
        summary: 'Daftar katalog produk & menu',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'is_best_seller', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: { description: 'Daftar produk' },
        },
      },
      post: {
        summary: 'Buat produk baru (Manager/Supervisor)',
        responses: {
          201: { description: 'Produk berhasil dibuat' },
        },
      },
    },
    '/orders': {
      post: {
        summary: 'Checkout pesanan kasir POS (otomatis kurangi stok & generate struk)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Checkout berhasil diproses' },
          400: { description: 'Stok tidak mencukupi atau uang tunai kurang' },
        },
      },
      get: {
        summary: 'Riwayat transaksi order kasir',
        responses: {
          200: { description: 'Daftar order kasir' },
        },
      },
    },
    '/orders/{id}/cancel': {
      patch: {
        summary: 'Batalkan order kasir dan kembalikan stok secara atomik',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Order dibatalkan dan stok dikembalikan' },
        },
      },
    },
    '/purchase-orders': {
      post: {
        summary: 'Buat Purchase Order bahan baku (tambah stok & catat pengeluaran)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePoRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Purchase order berhasil dicatat' },
        },
      },
    },
    '/stock-opname/sessions': {
      post: {
        summary: 'Buat sesi stok opname, sesuaikan stok, dan catat kerugian otomatis jika ada',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOpnameSessionRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Sesi opname selesai dan stok diperbarui' },
        },
      },
    },
    '/reports/sales-summary': {
      get: {
        summary: 'Laporan ringkasan penjualan & metode pembayaran',
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: { description: 'Ringkasan penjualan' },
        },
      },
    },
    '/reports/profit-loss': {
      get: {
        summary: 'Laporan laba rugi (Pendapatan - HPP - Beban Operasional)',
        responses: {
          200: { description: 'Perhitungan laba rugi kafe' },
        },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

module.exports = {
  setupSwagger,
  swaggerDocument,
};
