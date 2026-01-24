import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs'; // Import fs

// GET: Fetch sessions for a specific student
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        fs.appendFileSync('student_debug.log', `[${new Date().toISOString()}] GET /sessions - User: ${userId}\n`);

        if (!userId) {
            return NextResponse.json({ error: "UserId is required" }, { status: 400 });
        }

        const sessions = await prisma.aiSession.findMany({
            where: { userId: userId }, // Strict filtering
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        return NextResponse.json(sessions);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }
}

// POST: Create a new session for a student
export async function POST(req: Request) {
    try {
        const { userId } = await req.json();
        fs.appendFileSync('student_debug.log', `[${new Date().toISOString()}] POST /sessions - Creating for User: ${userId}\n`);

        if (!userId) {
            return NextResponse.json({ error: "UserId is required" }, { status: 400 });
        }

        // Validate user exists (security check)
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: "Invalid User" }, { status: 401 });
        }

        const session = await prisma.aiSession.create({
            data: {
                title: "New Chat",
                userId: userId // Link to student
            }
        });
        return NextResponse.json(session);
    } catch (error: any) {
        console.error("Error creating session:", error);
        fs.appendFileSync('student_debug.log', `[${new Date().toISOString()}] ERROR Creating Session: ${error.message}\n`);
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
}
