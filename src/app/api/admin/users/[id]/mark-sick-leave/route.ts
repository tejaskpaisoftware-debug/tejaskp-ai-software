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
        if (!id) return NextResponse.json({ message: "User ID Required" }, { status: 400 });

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // 1. Check if an attendance record already exists for today
        const existing = await prisma.attendance.findFirst({
            where: { userId: id, date: today }
        });

        if (existing) {
            // Update to SICK LEAVE
            await prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    status: "SICK_LEAVE",
                    isAbsent: true,
                    informedInAdvance: true,
                    adminRemarks: "Manually marked Sick Leave by Admin"
                }
            });
        } else {
            // Create new record as SICK LEAVE
            await prisma.attendance.create({
                data: {
                    userId: id,
                    date: today,
                    status: "SICK_LEAVE",
                    isAbsent: true,
                    informedInAdvance: true,
                    adminRemarks: "Manually marked Sick Leave by Admin",
                    loginTime: now
                }
            });
        }

        // 2. Trigger Automation exactly according to user specs
        console.log(`[Admin] Manual Sick Leave triggered WhatsApp care package for ${id}.`);

        let sendError = null;
        try {
            // In-App Notification & WhatsApp Warning
            await NotificationService.sendSickLeaveCare(adminUserId, id);
        } catch (e: any) {
            console.error("Caught error deep in Notifications:", e);
            sendError = e.message || String(e);
        }

        return NextResponse.json({
            success: true,
            message: `User manually marked on SICK LEAVE for today${sendError ? ' (WhatsApp Failed: ' + sendError + ')' : ' (Messages Sent!)'}`,
            debug: sendError
        });

    } catch (error) {
        console.error("Manual Sick Leave Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
