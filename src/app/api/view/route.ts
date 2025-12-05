import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const key = `onelook:${id}`;

        // 【核心逻辑】原子性操作：获取并删除
        // 如果 key 不存在，返回 null
        const data = await redis.getdel(key);

        if (!data) {
            // 404 既可能是 ID 错了，也可能是已经被销毁了，不需要区分（更安全）
            return NextResponse.json(
                { error: 'Secret not found or already destroyed' },
                { status: 404 }
            );
        }

        // 返回之前存的 JSON 字符串（前端负责 JSON.parse）
        return NextResponse.json({ encryptedContent: JSON.parse(data) });

    } catch (error) {
        console.error('View Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}