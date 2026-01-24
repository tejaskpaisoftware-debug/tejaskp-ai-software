import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const contactId = searchParams.get("contactId");

        if (!userId || !contactId) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        // Find conversation between these two users
        // Prisma doesn't support easy "contains all" for 1-1 chat lookups without explicit Conversation IDs usually,
        // but we can query conversations where both are participants.

        // Strategy: Find conversations where "userId" is a participant, then filter for "contactId".
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { id: userId }
                }
            },
            include: {
                participants: {
                    select: { id: true }
                },
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        const conversation = conversations.find(c =>
            c.participants.some(p => p.id === contactId) && c.participants.length === 2
        );

        return NextResponse.json({ success: true, conversation: conversation || null, messages: conversation?.messages || [] });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { senderId, recipientId, content, type, fileUrl } = body;

        console.log(`[CHAT] Sending message from ${senderId} to ${recipientId}`);

        if (!senderId || !recipientId) {
            console.error("[CHAT] Missing participants");
            return NextResponse.json({ success: false, error: "Missing participants" }, { status: 400 });
        }

        // Check if conversation exists
        // Robust Conversation Finding Strategy (Matching GET route logic)
        // 1. Fetch all conversations where sender is a participant
        const existingConversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { id: senderId }
                }
            },
            include: {
                participants: {
                    select: { id: true }
                }
            }
        });

        // 2. Filter in memory for the exact 1-1 match 
        let conversation = existingConversations.find(c =>
            c.participants.length === 2 &&
            c.participants.some(p => p.id === recipientId)
        );

        console.log(`[CHAT] Found existing conversation? ${conversation ? conversation.id : 'NO'}`);

        // 3. Create if doesn't exist
        if (!conversation) {
            console.log("[CHAT] Creating new conversation...");
            try {
                conversation = await prisma.conversation.create({
                    data: {
                        type: "DIRECT",
                        participants: {
                            connect: [
                                { id: senderId },
                                { id: recipientId }
                            ]
                        }
                    },
                    include: { participants: { select: { id: true } } }
                });
                console.log(`[CHAT] New conversation created: ${conversation.id}`);
            } catch (createError) {
                console.error("[CHAT] Failed to create conversation:", createError);
                return NextResponse.json({ success: false, error: "Failed to create conversation. Check if users exist." }, { status: 500 });
            }
        }

        // Create Message
        console.log("[CHAT] Creating message record...");
        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId,
                content: content || "",
                type: type || "TEXT",
                fileUrl
            }
        });
        console.log(`[CHAT] Message created: ${message.id}`);

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error("[CHAT] Critical Error sending message:", error);
        return NextResponse.json({ success: false, error: "Failed to send message: " + String(error) }, { status: 500 });
    }
}
