import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get top 10 scores
        const leaderboard = await prisma.racingLeaderboard.findMany({
            take: 10,
            orderBy: { score: 'desc' },
        });

        return NextResponse.json({ success: true, leaderboard });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, score, userId } = await request.json();

        await prisma.racingLeaderboard.create({
            data: {
                name,
                score,
                userId: userId || null
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to post score' }, { status: 500 });
    }
}
