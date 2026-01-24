import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch messages for a specific session (Security: Check ownership)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: "UserId is required" }, { status: 400 });
        }

        const session = await prisma.aiSession.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Ownership Check
        if (session.userId !== userId) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error("Error fetching session:", error);
        return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
    }
}

// DELETE: Delete a session (Security: Check ownership)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { userId } = await req.json(); // Expect userId in body for ownership check

        if (!userId) {
            return NextResponse.json({ error: "UserId is required" }, { status: 400 });
        }

        const session = await prisma.aiSession.findUnique({ where: { id } });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Ownership Check
        if (session.userId !== userId) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        await prisma.aiSession.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting session:", error);
        return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
    }
}
