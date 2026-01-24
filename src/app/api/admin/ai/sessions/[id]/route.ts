
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch messages for a specific session
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const session = await prisma.aiSession.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' } // Oldest first for chat history
                }
            }
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error("Error fetching session:", error);
        return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
    }
}

// DELETE: Delete a session
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        await prisma.aiSession.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting session:", error);
        return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
    }
}
