
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all sessions for a user (Assuming Admin or single user context for now, or fetch all)
export async function GET(req: Request) {
    try {
        // In a real app, we would get userId from session/auth
        // For now, we will fetch all sessions or filter by a fixed "admin" ID if we used one.
        // Let's assume we fetch all for the admin dashboard.

        const sessions = await prisma.aiSession.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' } // Just to get a snippet if needed
                }
            }
        });

        return NextResponse.json(sessions);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }
}

// POST: Create a new session
export async function POST(req: Request) {
    try {
        // Create a new empty session
        const session = await prisma.aiSession.create({
            data: {
                title: "New Chat",
                // userId: ... (if we had auth)
            }
        });

        return NextResponse.json(session);
    } catch (error) {
        console.error("Error creating session:", error);
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
}
