import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('production'),
  PORT: Joi.number().default(3001),
  API_PREFIX: Joi.string().default('api'),
  
  // Database
  DATABASE_URL: Joi.string().required(),
  
  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  
  // 0G Network
  ZERO_G_TESTNET_RPC: Joi.string().uri().required(),
  ZERO_G_CHAIN_ID: Joi.string().default('16601'),
  ZERO_G_EXPLORER: Joi.string().uri().optional(),
  ZERO_G_FAUCET: Joi.string().uri().optional(),
  
  // Security
  CORS_ORIGINS: Joi.string().required(),
  DOMAIN: Joi.string().hostname().required(),
  URI: Joi.string().uri().required(),
  
  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  
  // Development
  TEST_ENV: Joi.string().valid('true', 'false').default('false'),
});