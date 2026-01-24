import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// JOIN: Add a player to the session
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Params are async in Next.js 15+
) {
    try {
        const { id } = await params;
        const { name, carColor, userId } = await request.json();

        if (!name) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        const session = await prisma.racingSession.findUnique({
            where: { id },
            include: { players: true }
        });

        if (!session) {
            return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }

        if (session.status !== 'WAITING') {
            return NextResponse.json({ success: false, error: 'Game already started' }, { status: 400 });
        }

        const player = await prisma.racingPlayer.create({
            data: {
                sessionId: id,
                name,
                carColor: carColor || 'red',
                userId: userId || null,
                status: 'READY'
            }
        });

        return NextResponse.json({ success: true, player });

    } catch (error) {
        console.error('Error joining racing session:', error);
        return NextResponse.json({ success: false, error: 'Failed to join session' }, { status: 500 });
    }
}
