import Redis from 'ioredis';

const getRedisUrl = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    throw new Error('REDIS_URL is not defined');
};

// Use globalThis to prevent creating too many connections due to Next.js hot reload
const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(getRedisUrl());

if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}