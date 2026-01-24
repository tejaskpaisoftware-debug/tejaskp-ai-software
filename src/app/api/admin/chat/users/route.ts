import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: ['STUDENT', 'CLIENT', 'EMPLOYEE']
                },
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                role: true,
                mobile: true,
                isChatEnabled: true,
                email: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({ success: true, users });
    } catch (error) {
        console.error("Error fetching chat users:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { userId, isChatEnabled } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { isChatEnabled }
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error("Error updating chat status:", error);
        return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 });
    }
}
