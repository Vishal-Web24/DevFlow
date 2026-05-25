import Redis from 'ioredis';
// using ioredis over the official redis package because 
// it has better TypeScript support and built-in retry logic
let redisClient: Redis;

export const connectRedis = (): Redis => {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
  });

  redisClient.on('connect', () => console.log('✅ Redis connected'));
  redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));

  return redisClient;
};

export const getRedis = (): Redis => {
  if (!redisClient) throw new Error('Redis not initialized. Call connectRedis() first.');
  return redisClient;
};
 

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const val = await getRedis().get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds = 300): Promise<void> => {
  try {
    await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('Cache set error:', err);
  }
};

export const cacheDel = async (...keys: string[]): Promise<void> => {
  try {
    if (keys.length > 0) await getRedis().del(...keys);
  } catch (err) {
    console.error('Cache delete error:', err);
  }
};

export const cachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await getRedis().keys(pattern);
    if (keys.length > 0) await getRedis().del(...keys);
  } catch (err) {
    console.error('Cache pattern delete error:', err);
  }
};

// Rate limiting helper
export const rateLimit = async (
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> => {
  const redis = getRedis();
  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, windowSeconds);
  return {
    allowed: current <= maxRequests,
    remaining: Math.max(0, maxRequests - current),
  };
};
