import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInDays, parseISO, startOfDay } from "date-fns";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Apply Leave Request Body:", body); // DEBUG LOG

        const { userId, startDate, endDate, reason, type, isHalfDay } = body;

        if (!userId || !startDate || !endDate || !reason) {
            console.error("Missing fields:", { userId, startDate, endDate, reason });
            return NextResponse.json(
                { message: "All fields are required" },
                { status: 400 }
            );
        }

        // Ensure isHalfDay is boolean
        const halfDayBool = isHalfDay === true || isHalfDay === "true";

        // --- CASUAL LEAVE 2-DAY RULE ---
        let finalStatus = "PENDING";
        let autoRemark = "";

        if ((type === "CL" || type === "Casual") && startDate) {
            const today = startOfDay(new Date());
            const leaveStart = startOfDay(parseISO(startDate));
            const daysDiff = differenceInDays(leaveStart, today);

            if (daysDiff < 2) {
                finalStatus = "REJECTED";
                autoRemark = "Auto-rejected: Must apply at least 2 days in advance.";
            }
        }

        const leave = await prisma.leave.create({
            data: {
                userId,
                startDate,
                endDate,
                reason,
                type: type || "CL",
                status: finalStatus,
                isHalfDay: halfDayBool,
                managerRemarks: autoRemark || null
            }
        });

        const { NotificationService } = require("@/lib/notifications");

        // --- AUTOMATIC CASUAL LEAVE REJECTION NOTIFICATION ---
        if (finalStatus === "REJECTED" && (type === "CL" || type === "Casual")) {
            await NotificationService.sendCasualLeaveRejected(userId);
        }

        // --- SICK LEAVE CARE TRIGGER ---
        if (type === "Medical" || type === "Sick" || reason.toLowerCase().includes("sick") || reason.toLowerCase().includes("fever")) {
            const { NotificationService } = require("@/lib/notifications");
            await NotificationService.sendSickLeaveCare(userId);
        }

        return NextResponse.json(leave);
    } catch (error) {
        console.error("Apply leave error:", error);
        return NextResponse.json(
            {
                message: "Internal Server Error",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { message: "User ID required" },
                { status: 400 }
            );
        }

        const leaves = await prisma.leave.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(leaves);
    } catch (error) {
        console.error("Fetch user leaves error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
