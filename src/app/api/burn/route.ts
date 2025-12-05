import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getRedisKey } from '@/lib/utils';
import { VaultData } from '../vault/route';

export type BurnResponse = VaultData;

export async function POST(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const data = await redis.getdel(getRedisKey(id));

        if (!data) {
            return NextResponse.json(
                { error: 'Secret not found or already destroyed' },
                { status: 404 }
            );
        }

        return NextResponse.json(JSON.parse(data) as BurnResponse);

    } catch (error) {
        console.error('View Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}