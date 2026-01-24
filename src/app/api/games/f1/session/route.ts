import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// HOST: Create a new racing session
export async function POST(request: Request) {
    try {
        // Determine user if desired, for now we allow guest hosting or assume client sends info
        // But typically we'd read session/cookie. 
        // We'll return the session ID and the join code.

        const session = await prisma.racingSession.create({
            data: {
                status: 'WAITING',
            }
        });

        return NextResponse.json({ success: true, session });

    } catch (error) {
        console.error('Error creating racing session:', error);
        return NextResponse.json({ success: false, error: 'Failed to create session: ' + (error as Error).message }, { status: 500 });
    }
}
