/**
 * Routes Realtime Server-Sent Events (SSE)
 */
const express = require('express');
const router = express.Router();
const realtime = require('../utils/realtime');

router.get('/', (req, res) => {
  realtime.addClient(req, res);
});

router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    active_clients: realtime.getActiveClientCount(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
