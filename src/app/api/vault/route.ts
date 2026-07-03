import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { nanoid } from 'nanoid';
import { getRedisKey } from '@/lib/utils';
import { MAX_FILE_SIZE, SecretTypes } from '@/lib/constants';

export interface VaultRequestPayload {
    iv: string;
    secretType: SecretTypes;
    data: string;
    ttl: number;
}

export interface VaultData {
    iv: string;
    secretType: SecretTypes;
    data: string;
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body = await request.json() as VaultRequestPayload;

        const { iv, secretType, data, ttl = 24 * 60 * 60 } = body;

        if (!iv || !data || !secretType) {
            return NextResponse.json({ error: 'iv and data required' }, { status: 400 });
        }

        // Server-side size guard (the client-side MAX_FILE_SIZE check is bypassable).
        // Files are base64-encoded, JSON-wrapped, encrypted, then base64-encoded
        // again, inflating them by ~1.8x — allow 2x headroom.
        if (data.length > MAX_FILE_SIZE * 2) {
            return NextResponse.json({ error: 'payload too large' }, { status: 413 });
        }

        if (ttl <= 0 || ttl > 24 * 60 * 60) {
            return NextResponse.json({ error: 'invalid ttl' }, { status: 400 });
        }

        const id = nanoid(10);

        await redis.set(getRedisKey(id), JSON.stringify({ iv, secretType, data }), 'EX', ttl);

        return NextResponse.json({ id });
    } catch (error) {
        console.error('Store Error:', error);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
}