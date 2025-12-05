import Redis from 'ioredis';

const getRedisUrl = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    throw new Error('REDIS_URL is not defined');
};

// 使用 globalThis 防止 Next.js 热重载导致创建过多连接
const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(getRedisUrl());

if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}