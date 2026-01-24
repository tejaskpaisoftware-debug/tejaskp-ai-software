import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const currentUserId = searchParams.get("userId");

        if (!currentUserId) {
            return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
        }

        // Permission check removed to allow all active users to access the chat list
        // if (!currentUser?.isChatEnabled) { ... }

        // 1. Fetch all ACTIVE users
        const users = await prisma.user.findMany({
            where: {
                status: 'ACTIVE',
                id: { not: currentUserId }
            },
            select: {
                id: true,
                name: true,
                role: true,
                mobile: true,
                joiningLetters: {
                    select: { designation: true },
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                },
                sessions: {
                    select: { expiresAt: true },
                    where: { expiresAt: { gt: new Date() } },
                    take: 1
                }
            }
        });

        // 2. Fetch Conversations for Last Message Preview
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: { some: { id: currentUserId } }
            },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                },
                participants: {
                    select: { id: true }
                }
            }
        });

        // Create Map: OtherUserId -> LastMessage
        const lastMessageMap = new Map();
        conversations.forEach(conv => {
            const otherParticipant = conv.participants.find(p => p.id !== currentUserId);
            if (otherParticipant && conv.messages.length > 0) {
                lastMessageMap.set(otherParticipant.id, conv.messages[0]);
            }
        });

        // 3. Map & Sort
        const contacts = users.map(user => {
            const lastMsg = lastMessageMap.get(user.id);
            return {
                id: user.id,
                name: user.name,
                mobile: user.mobile,
                role: user.role,
                designation: user.joiningLetters[0]?.designation || user.role,
                isOnline: user.sessions.length > 0,
                lastMessage: lastMsg ? lastMsg.content : null,
                lastMessageSenderId: lastMsg ? lastMsg.senderId : null,
                lastMessageTime: lastMsg ? lastMsg.createdAt : null,
            };
        });

        // SORTING LOGIC: 
        // 1. Online First
        // 2. Has Message (Recent first)
        // 3. Alphabetical
        contacts.sort((a, b) => {
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;

            // If both same online status, check last message time
            if (a.lastMessageTime && b.lastMessageTime) {
                return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
            }
            if (a.lastMessageTime) return -1; // a has message, b doesn't -> a comes first
            if (b.lastMessageTime) return 1;

            // Fallback to name
            const nameA = a.name || "Unknown";
            const nameB = b.name || "Unknown";
            return nameA.localeCompare(nameB);
        });

        return NextResponse.json({ success: true, contacts });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch contacts" }, { status: 500 });
    }
}
