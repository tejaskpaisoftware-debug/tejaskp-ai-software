import { NextResponse } from 'next/server';
import WhatsAppManager from '@/lib/whatsappClient';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const execPromise = promisify(exec);

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

export async function POST() {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log(`[WhatsApp - ${userId}] Hard Reset Requested...`);

        // 1. Destroy existing instance
        await WhatsAppManager.reset(userId);

        // 2. Force delete user-specific session directory
        const authPath = process.env.WHATSAPP_SESSION_PATH || '.wwebjs_auth';
        const rootDir = process.cwd();
        const userSessionPath = path.join(rootDir, authPath, `session-${userId}`);

        try {
            // Kill any orphaned chromium processes for this user
            // On Mac, Puppeteer might launch "Google Chrome for Testing"
            console.log(`[WhatsApp - ${userId}] cleaning up browser processes...`);
            await execPromise('pkill -f "Google Chrome for Testing" || true');
            await execPromise('pkill -f chromium || true');
            await execPromise('pkill -f puppeteer || true');

            if (fs.existsSync(userSessionPath)) {
                await execPromise(`rm -rf "${userSessionPath}"`);
                console.log(`[WhatsApp - ${userId}] Session directory cleared: ${userSessionPath}`);
            }
        } catch (e) {
            console.error(`[WhatsApp - ${userId}] Cleanup warning: ${e}`);
        }

        // 3. Small delay to let OS release file locks
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. Re-initialize
        await WhatsAppManager.initialize(userId);

        return NextResponse.json({ success: true, message: "Server reset successful. Please refresh in 10 seconds." });
    } catch (error) {
        console.error('Failed to reset WhatsApp:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
