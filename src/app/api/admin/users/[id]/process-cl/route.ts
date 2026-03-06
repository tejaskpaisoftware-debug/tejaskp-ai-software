import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/notifications";
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');
        const { payload } = await jwtVerify(token, secret);
        return payload.userId as string;
    } catch {
        return null;
    }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const adminUserId = await getAuthUserId();
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const body = await request.json();
        const { informedInAdvance, date } = body;

        if (!id) return NextResponse.json({ message: "User ID Required" }, { status: 400 });
        if (informedInAdvance === undefined || !date) {
            return NextResponse.json({ message: "Missing required fields (informedInAdvance, date)" }, { status: 400 });
        }

        const now = new Date();
        const targetDate = date; // Expecting YYYY-MM-DD

        // 1. Mark attendance exactly as requested
        const existing = await prisma.attendance.findFirst({
            where: { userId: id, date: targetDate }
        });

        if (existing) {
            await prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    status: informedInAdvance ? "CASUAL_LEAVE" : "ABSENT",
                    isAbsent: true,
                    informedInAdvance: informedInAdvance,
                    adminRemarks: informedInAdvance ? "Manual CL Approved by Admin" : "Manual CL Rejected by Admin (No 2-day notice)"
                }
            });
        } else {
            await prisma.attendance.create({
                data: {
                    userId: id,
                    date: targetDate,
                    status: informedInAdvance ? "CASUAL_LEAVE" : "ABSENT",
                    isAbsent: true,
                    informedInAdvance: informedInAdvance,
                    adminRemarks: informedInAdvance ? "Manual CL Approved by Admin" : "Manual CL Rejected by Admin (No 2-day notice)",
                    loginTime: now
                }
            });
        }

        // 2. Trigger appropriate WhatsApp message
        console.log(`[Admin] Manual Casual Leave process triggered for ${id}. Approved: ${informedInAdvance}`);
        let sendError = null;
        try {
            if (informedInAdvance) {
                await NotificationService.sendCasualLeaveApproved(adminUserId, id);
            } else {
                await NotificationService.sendCasualLeaveRejected(adminUserId, id);
            }
        } catch (e: any) {
            console.error("Caught error deep in Notifications:", e);
            sendError = e.message || String(e);
        }

        return NextResponse.json({
            success: true,
            message: informedInAdvance
                ? `Casual Leave APPROVED and WhatsApp Messages Sent!`
                : `Casual Leave REJECTED and WhatsApp Messages Sent!`,
            debug: sendError
        });

    } catch (error) {
        console.error("Manual CL Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
