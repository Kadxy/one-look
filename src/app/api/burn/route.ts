import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { nanoid } from 'nanoid'; // 你可能需要 pnpm add nanoid

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { encryptedContent, ttl } = body;

        if (!encryptedContent) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 });
        }

        // 生成短 ID (URL 友好)
        const id = nanoid(10); // 10位足够了，不用 UUID 那么长
        const key = `onelook:${id}`; // 加上你的前缀

        // 默认过期时间 24小时 (秒)
        // 如果前端传了 ttl (比如 1小时=3600)，就用前端的，否则默认 86400
        const expiration = ttl && typeof ttl === 'number' ? ttl : 86400;

        // 存入 Redis 并设置过期时间
        await redis.set(key, JSON.stringify(encryptedContent), 'EX', expiration);

        return NextResponse.json({ id });
    } catch (error) {
        console.error('Burn Error:', error);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
}