import { NextResponse } from 'next/server';

export async function GET() {
    const clients: any = {};
    if (globalThis._whatsappClients) {
        globalThis._whatsappClients.forEach((state, userId) => {
            clients[userId] = {
                isReady: state.isReady,
                hasInstance: !!state.instance,
                isInitializing: state.isInitializing,
                logs: state.logs?.slice(-5) || []
            };
        });
    }
    return NextResponse.json({ clients });
}
