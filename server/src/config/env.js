import * as dotenv from 'dotenv';
import { z } from 'zod';
import logger from './logger.js';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/upi-offline-mesh'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(8).default('supersecretjwtkeyforupiofflineportfolioproject'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().default(86400),
  PACKET_MAX_AGE_SECONDS: z.coerce.number().default(86400),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error('Invalid environment configuration:');
  logger.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export default env;
