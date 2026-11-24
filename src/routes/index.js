/**
 * Agregator Routes API v1 Ivory Brew Caffe
 */
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const shiftRoutes = require('./shift.routes');
const rawMaterialRoutes = require('./rawMaterial.routes');
const recipeRoutes = require('./recipe.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const memberRoutes = require('./member.routes');
const purchaseOrderRoutes = require('./purchaseOrder.routes');
const stockOpnameRoutes = require('./stockOpname.routes');
const expenseRoutes = require('./expense.routes');
const reportRoutes = require('./report.routes');
const eventRoutes = require('./events.routes');

// Endpoint Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server Ivory Brew Caffe REST API beroperasi secara normal',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(1)} detik`,
  });
});

// Pendaftaran sub-rute modul
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/shifts', shiftRoutes);
router.use('/raw-materials', rawMaterialRoutes);
router.use('/recipes', recipeRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/members', memberRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/stock-opname', stockOpnameRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reports', reportRoutes);
router.use('/events', eventRoutes);

module.exports = router;
