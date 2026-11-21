/**
 * Realtime Event Streaming Hub (Server-Sent Events)
 * Mengelola koneksi klien aktif dan mem-broadcast event secara realtime
 */
const clients = new Set();

/**
 * Mendaftarkan klien baru ke streaming SSE
 */
const addClient = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering untuk Nginx/proxy
    'Access-Control-Allow-Origin': '*',
  });

  // Kirim initial connection handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  clients.add(res);

  // Heartbeat ping setiap 25 detik agar koneksi tidak diputus
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
};

/**
 * Mem-broadcast event ke seluruh klien aktif
 * @param {string} eventType Tipe event (contoh: 'order:created', 'role:updated')
 * @param {object} payload Data detail event
 */
const broadcast = (eventType, payload = {}) => {
  const data = JSON.stringify({
    type: eventType,
    payload,
    timestamp: new Date().toISOString(),
  });

  for (const client of clients) {
    try {
      client.write(`event: message\ndata: ${data}\n\n`);
    } catch {
      clients.delete(client);
    }
  }
};

/**
 * Mendapatkan jumlah klien aktif yang terhubung
 */
const getActiveClientCount = () => clients.size;

module.exports = {
  addClient,
  broadcast,
  getActiveClientCount,
};
