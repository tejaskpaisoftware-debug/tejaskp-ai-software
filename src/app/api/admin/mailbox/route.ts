import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (userId) {
            const mailbox = await prisma.mailbox.findUnique({
                where: { userId },
                include: {
                    user: {
                        select: {
                            name: true,
                            role: true,
                            photoUrl: true
                        }
                    }
                }
            });
            return NextResponse.json({ success: true, mailbox });
        }

        const mailboxes = await prisma.mailbox.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        role: true,
                        photoUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, mailboxes });
    } catch (error) {
        console.error("Fetch mailboxes error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, emailAddress } = body;

        if (!userId || !emailAddress) {
            return NextResponse.json({ success: false, error: "UserId and EmailAddress are required" }, { status: 400 });
        }

        // Check if user already has a mailbox
        const existingUserMailbox = await prisma.mailbox.findUnique({
            where: { userId }
        });

        if (existingUserMailbox) {
            return NextResponse.json({ success: false, error: "User already has a mailbox assigned" }, { status: 400 });
        }

        // Validate unique email address
        const existingEmail = await prisma.mailbox.findUnique({
            where: { emailAddress }
        });

        if (existingEmail) {
            return NextResponse.json({ success: false, error: "Email address already exists" }, { status: 400 });
        }

        const mailbox = await prisma.mailbox.create({
            data: {
                userId,
                emailAddress,
                storageLimit: 5368709120 // 5 GB default
            }
        });

        return NextResponse.json({ success: true, mailbox });
    } catch (error) {
        console.error("Create mailbox error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "Mailbox ID is required" }, { status: 400 });
        }

        await prisma.mailbox.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete mailbox error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
