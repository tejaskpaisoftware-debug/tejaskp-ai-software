import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Helper: Get Auth User
async function getAuthUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (e) {
        return null;
    }
}

export async function PATCH(request: Request) {
    const user: any = await getAuthUser();

    // 1. Auth Check: Admin Only
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { userId, weekDate, status } = body;

        if (!userId || !weekDate || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const validStatuses = ['APPROVED', 'REJECTED', 'PENDING', 'SUBMITTED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // 2. Update Status
        // 2. Find Submission first (since userId_weekStartDate is not a unique constraint in schema yet)
        const existing = await prisma.submission.findFirst({
            where: {
                userId,
                weekStartDate: weekDate
            }
        });

        if (!existing) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        const submission = await prisma.submission.update({
            where: { id: existing.id },
            data: {
                status
            }
        });

        return NextResponse.json({ success: true, submission });

    } catch (error: any) {
        console.error("Submission Status Update Error:", error);
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
