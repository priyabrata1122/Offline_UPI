import mongoose from 'mongoose';
import { createClient } from 'redis';
import env from './env.js';
import logger from './logger.js';

export let redisClient = null;
let isRedisConnected = false;

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

export async function connectRedis() {
  try {
    logger.info(`Connecting to Redis at ${env.REDIS_URL}...`);
    const client = createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            return false; // Stop retrying, reject connect promise
          }
          return 500; // wait 500ms
        }
      }
    });

    client.on('error', (err) => {
      logger.warn(`Redis client error: ${err.message}. Falling back to in-memory idempotency cache.`);
      isRedisConnected = false;
    });

    client.on('connect', () => {
      logger.info('Redis connection established');
      isRedisConnected = true;
    });

    await client.connect();
    redisClient = client;
  } catch (error) {
    logger.warn(`Could not connect to Redis: ${error.message}. In-memory fallback will be active.`);
    redisClient = null;
    isRedisConnected = false;
  }
}

export function getRedisStatus() {
  return isRedisConnected && redisClient !== null;
}
