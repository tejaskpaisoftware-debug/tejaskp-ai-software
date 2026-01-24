import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch Session State (Polling)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await prisma.racingSession.findUnique({
            where: { id },
            include: {
                players: {
                    select: {
                        id: true,
                        name: true,
                        carColor: true,
                        score: true,
                        speed: true,
                        status: true,
                        updatedAt: true
                    },
                    orderBy: { score: 'desc' }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, session });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Error fetching state" }, { status: 500 });
    }
}

// PUT: Update Player State (Heartbeat) or Session Status
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { playerId, score, speed, status, sessionStatus } = await request.json();

        // 1. Update Session Status (e.g. Host starting game)
        if (sessionStatus) {
            await prisma.racingSession.update({
                where: { id },
                data: { status: sessionStatus }
            });
            return NextResponse.json({ success: true });
        }

        // 2. Update Player State (Heartbeat)
        if (playerId) {
            await prisma.racingPlayer.update({
                where: { id: playerId },
                data: {
                    score,
                    speed,
                    status,
                    lastHeartbeat: new Date()
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Error updating state" }, { status: 500 });
    }
}
