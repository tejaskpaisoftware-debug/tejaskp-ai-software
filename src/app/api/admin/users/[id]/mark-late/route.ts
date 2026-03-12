import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import WhatsAppManager from "@/lib/whatsappClient";
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

        // 1. Create or update late record for today
        // Using upsert to avoid "already exists" unique constraint error
        await prisma.attendance.upsert({
            where: {
                userId_date: {
                    userId: id,
                    date: today
                }
            },
            update: {
                status: "LATE"
            },
            create: {
                userId: id,
                date: today,
                status: "LATE"
            }
        });

        // 2. Check total Lates for the month for this user
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lateCount = await prisma.attendance.count({
            where: {
                userId: id,
                status: "LATE",
                date: {
                    gte: firstDayOfMonth,
                    lte: today
                }
            }
        });

        let smsLogs: any = {};

        // 3. Trigger Automation for every click (as requested)
        console.log(`[Admin] Manual Late triggered WhatsApp notifications for ${id}. Total Lates this month: ${lateCount}`);

        // In-App Notification
        await NotificationService.sendLateWarning(id, lateCount);

        // Fetch Mobile Numbers for WhatsApp
        const userExt = await prisma.user.findUnique({
            where: { id: id },
            select: { name: true, parentMobile: true, mobile: true }
        });

        if (userExt) {
            // Always send to BOTH if they exist
            if (userExt.parentMobile) {
                smsLogs.parent = await WhatsAppManager.sendMessage(
                    adminUserId,
                    userExt.parentMobile,
                    `*LATE ARRIVAL NOTICE - ${userExt.name}*\n\nDear Parent/Guardian,\n\nThis is to notify you that your ward, ${userExt.name}, was marked late today. This is their instance #${lateCount} for this month.\n\nPlease ensure they check-in on time to meet the required guidelines.\n\nRegards,\nAdmin - Tejaskp AI Software`
                );
            }

            if (userExt.mobile) {
                smsLogs.student = await WhatsAppManager.sendMessage(
                    adminUserId,
                    userExt.mobile,
                    `*LATE CHECK-IN NOTICE*\n\nHi ${userExt.name},\n\nYou have been marked late today. This is late instance #${lateCount} for this month.\n\nPlease try to check in on time moving forward.\n\nRegards,\nAdmin - Tejaskp AI Software`
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: `User manually marked as LATE. Total lates this month: ${lateCount}. WhatsApp messages sent to ${userExt?.parentMobile ? 'Parent' : ''} ${userExt?.mobile ? '& Student' : ''}`,
            lateCount,
            smsLogs
        });

    } catch (error) {
        console.error("Manual Late Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
