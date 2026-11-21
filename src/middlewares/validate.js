/**
 * Middleware Validasi Payload Request menggunakan Joi
 */
const AppError = require('../utils/AppError');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
      }));

      return next(new AppError('Validasi input gagal', 422, errorDetails));
    }

    // Perbarui properti request dengan data yang sudah di-sanitize
    req[property] = value;
    next();
  };
};

module.exports = validate;
