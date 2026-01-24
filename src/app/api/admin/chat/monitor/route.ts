import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get("conversationId");
        const dateStr = searchParams.get("date"); // YYYY-MM-DD

        // 1. Fetch Full History for a specific conversation
        if (conversationId) {
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    participants: {
                        select: { id: true, name: true, role: true }
                    },
                    messages: {
                        orderBy: { createdAt: 'asc' }, // Oldest first for reading flow
                    }
                }
            });
            return NextResponse.json({ success: true, conversation });
        }

        // 2. Filter by Date (Default to today/all if not specific logic needed, but user asked for date search)
        let dateFilter: any = {};
        if (dateStr) {
            const startOfDay = new Date(dateStr);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(dateStr);
            endOfDay.setHours(23, 59, 59, 999);

            dateFilter = {
                updatedAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            };
        }

        // Fetch recent conversations list
        const conversations = await prisma.conversation.findMany({
            where: dateFilter,
            include: {
                participants: {
                    select: { id: true, name: true, role: true }
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: { content: true, createdAt: true, type: true }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 50 // Increased limit
        });

        return NextResponse.json({ success: true, conversations });
    } catch (error) {
        console.error("Error monitoring chat:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch chats" }, { status: 500 });
    }
}
