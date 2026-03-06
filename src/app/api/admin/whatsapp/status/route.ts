import { NextResponse } from 'next/server';
import WhatsAppManager from '@/lib/whatsappClient';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');
        const { payload } = await jwtVerify(token, secret);
        return payload.userId as string;
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const status = WhatsAppManager.getStatus(userId);

        return NextResponse.json({
            isReady: status.isReady,
            qrCode: status.qrCode,
            pairingCode: status.pairingCode,
            cooldownUntil: status.cooldownUntil || 0
        });
    } catch (error) {
        console.error('Failed to get WhatsApp status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { mobile } = await request.json();
        if (!mobile) return NextResponse.json({ message: "Mobile Required" }, { status: 400 });

        const code = await WhatsAppManager.requestPairingCode(userId, mobile);
        if (!code) return NextResponse.json({ message: "Failed to generate code." }, { status: 500 });

        return NextResponse.json({ pairingCode: code });
    } catch (error: any) {
        console.error('Failed to request pairing code:', error);

        // Extract as much info as possible
        const message = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
        const stack = error.stack;

        console.log('[DEBUG API] Error Message:', message);
        if (stack) console.log('[DEBUG API] Error Stack:', stack);

        if (message.includes('RATE_LIMIT')) {
            return NextResponse.json({ message: message }, { status: 429 });
        }
        if (message.includes('LINKING_ERROR')) {
            return NextResponse.json({ message: message }, { status: 400 });
        }

        return NextResponse.json({
            message: message || 'Internal Server Error',
            details: error.stack || undefined,
            error: true
        }, { status: 500 });
    }
}
