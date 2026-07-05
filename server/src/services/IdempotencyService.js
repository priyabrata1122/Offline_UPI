import { redisClient, getRedisStatus } from '../config/db.js';
import env from '../config/env.js';
import logger from '../config/logger.js';

export class IdempotencyService {
  static instance;
  localCache = new Map();
  ttlSeconds = env.IDEMPOTENCY_TTL_SECONDS;
  evictionInterval = null;

  constructor() {
    this.evictionInterval = setInterval(() => {
      this.evictExpired();
    }, 60000);
  }

  static getInstance() {
    if (!IdempotencyService.instance) {
      IdempotencyService.instance = new IdempotencyService();
    }
    return IdempotencyService.instance;
  }

  async claim(packetHash) {
    const key = `idempotency:${packetHash}`;
    const now = new Date();

    if (getRedisStatus() && redisClient) {
      try {
        const result = await redisClient.set(key, now.toISOString(), {
          NX: true,
          EX: this.ttlSeconds,
        });
        return result === 'OK';
      } catch (err) {
        logger.error(`Redis command failed: ${err.message}. Falling back to memory.`);
      }
    }

    if (this.localCache.has(packetHash)) {
      return false;
    }
    this.localCache.set(packetHash, now);
    return true;
  }

  async size() {
    if (getRedisStatus() && redisClient) {
      try {
        const keys = await redisClient.keys('idempotency:*');
        return keys.length;
      } catch (err) {
        logger.error(`Redis size command failed: ${err.message}. Falling back to memory.`);
      }
    }
    return this.localCache.size;
  }

  evictExpired() {
    const cutoff = new Date(Date.now() - this.ttlSeconds * 1000);
    let evictedCount = 0;

    for (const [hash, timestamp] of this.localCache.entries()) {
      if (timestamp < cutoff) {
        this.localCache.delete(hash);
        evictedCount++;
      }
    }

    if (evictedCount > 0) {
      logger.debug(`Evicted ${evictedCount} expired keys from local idempotency cache.`);
    }
  }

  async clear() {
    if (getRedisStatus() && redisClient) {
      try {
        const keys = await redisClient.keys('idempotency:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch (err) {
        logger.error(`Redis clear command failed: ${err.message}.`);
      }
    }
    this.localCache.clear();
    logger.info('Idempotency cache cleared');
  }

  destroy() {
    if (this.evictionInterval) {
      clearInterval(this.evictionInterval);
    }
  }
}
export default IdempotencyService;
