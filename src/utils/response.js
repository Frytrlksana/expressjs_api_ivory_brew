/**
 * Standarisasi Response Format JSON
 */
const successResponse = (res, message = 'Sukses', data = {}, statusCode = 200, meta = null) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta !== null && meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const errorResponse = (res, message = 'Terjadi kesalahan pada server', errors = [], statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
