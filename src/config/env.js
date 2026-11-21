/**
 * Validasi dan konfigurasi Environment Variable
 */
const dotenv = require('dotenv');
const joi = require('joi');
const path = require('path');

// Muat file .env dari root project
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = joi
  .object({
    NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
    PORT: joi.number().default(5000),
    API_PREFIX: joi.string().default('/api/v1'),
    DB_DIALECT: joi.string().valid('mysql', 'postgres', 'sqlite').required(),
    DB_HOST: joi.string().when('DB_DIALECT', {
      is: 'sqlite',
      then: joi.optional().allow(''),
      otherwise: joi.required(),
    }),
    DB_PORT: joi.number().when('DB_DIALECT', {
      is: 'sqlite',
      then: joi.optional().allow(''),
      otherwise: joi.required(),
    }),
    DB_NAME: joi.string().when('DB_DIALECT', {
      is: 'sqlite',
      then: joi.optional().allow(''),
      otherwise: joi.required(),
    }),
    DB_USER: joi.string().when('DB_DIALECT', {
      is: 'sqlite',
      then: joi.optional().allow(''),
      otherwise: joi.required(),
    }),
    DB_PASSWORD: joi.string().allow('').default(''),
    DB_STORAGE: joi.string().when('DB_DIALECT', {
      is: 'sqlite',
      then: joi.required(),
      otherwise: joi.optional().allow(''),
    }),
    DB_LOGGING: joi.boolean().truthy('true').falsy('false').default(false),
    JWT_SECRET: joi.string().required(),
    JWT_EXPIRES_IN: joi.string().default('1d'),
    BCRYPT_SALT_ROUNDS: joi.number().integer().min(4).max(15).default(10),
    CORS_ORIGIN: joi.string().default('*'),
    RATE_LIMIT_WINDOW_MS: joi.number().integer().default(900000),
    RATE_LIMIT_MAX: joi.number().integer().default(100),
    TAX_RATE: joi.number().min(0).max(1).default(0.10),
    SEED_DEFAULT_PASSWORD: joi.string().required(),
  })
  .unknown(true);

const { value: envVars, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  const missingKeys = error.details.map((detail) => detail.message).join(', ');
  throw new Error(`Konfigurasi .env tidak valid atau tidak lengkap: ${missingKeys}`);
}

module.exports = {
  nodeEnv: envVars.NODE_ENV,
  port: envVars.PORT,
  apiPrefix: envVars.API_PREFIX,
  db: {
    dialect: envVars.DB_DIALECT,
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    name: envVars.DB_NAME,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    storage: envVars.DB_STORAGE,
    logging: envVars.DB_LOGGING ? console.log : false,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
  },
  bcrypt: {
    saltRounds: Number(envVars.BCRYPT_SALT_ROUNDS),
  },
  cors: {
    origin: envVars.CORS_ORIGIN,
  },
  rateLimit: {
    windowMs: Number(envVars.RATE_LIMIT_WINDOW_MS),
    max: Number(envVars.RATE_LIMIT_MAX),
  },
  business: {
    taxRate: Number(envVars.TAX_RATE),
  },
  seed: {
    defaultPassword: envVars.SEED_DEFAULT_PASSWORD,
  },
};
