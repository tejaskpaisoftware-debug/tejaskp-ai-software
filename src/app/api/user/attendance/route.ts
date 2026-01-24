import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET today's status OR history
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const type = searchParams.get("type"); // 'history' or undefined

        if (!userId) {
            return NextResponse.json({ message: "UserId required" }, { status: 400 });
        }

        if (type === 'history') {
            const history = await prisma.attendance.findMany({
                where: { userId },
                orderBy: { date: 'desc' }
            });
            return NextResponse.json(history);
        }

        // Default: Get Today's Status
        const today = new Date().toISOString().split('T')[0];
        const attendance = await prisma.attendance.findFirst({
            where: { userId, date: today }
        });

        return NextResponse.json(attendance || null);
    } catch (error) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

// Check In
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Ensure no record exists
        const existing = await prisma.attendance.findFirst({
            where: { userId, date: today }
        });

        if (existing) {
            return NextResponse.json({ message: "Already checked in" }, { status: 400 });
        }

        // --- TIME LOGIC ---
        // 10:45 AM Deadline
        const deadline = new Date(now);
        deadline.setHours(10, 45, 0, 0); // 10:45:00 AM

        let status = "PRESENT";
        let remarks = "";

        if (now > deadline) {
            status = "LATE";

            // Check "Late Limit" (3rd Strike Logic)
            // Count previous LATE entries in current month
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

            const lateCount = await prisma.attendance.count({
                where: {
                    userId,
                    status: "LATE",
                    date: {
                        gte: firstDayOfMonth, // >= 1st of month
                        lt: today // Strictly strictly before today (don't count today yet)
                    }
                }
            });

            // If user has already been late 2 times, today is the 3rd time
            if (lateCount >= 2) {
                status = "ABSENT";
                remarks = "Multiple Late Arrivals (3rd Strike)";
            }
        }

        const record = await prisma.attendance.create({
            data: {
                userId,
                date: today,
                loginTime: now,
                status,
                adminRemarks: remarks
            }
        });

        return NextResponse.json(record);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

// Check Out
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        const record = await prisma.attendance.findFirst({
            where: { userId, date: today }
        });

        if (!record) {
            return NextResponse.json({ message: "No check-in record found" }, { status: 400 });
        }

        const loginTime = new Date(record.loginTime);
        const diffMs = now.getTime() - loginTime.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        let newStatus = record.status;
        let newRemarks = record.adminRemarks || "";

        // Minimum 4 Hours Rule
        if (diffHours < 4) {
            newStatus = "ABSENT"; // Mark as absent if < 4 hours
            newRemarks = newRemarks ? `${newRemarks}, Early Leave (<4h)` : "Early Leave (<4h)";
        } else {
            // Be careful not to overwrite a previous "ABSENT" status (e.g. from 3rd strike late)
            // Only update to PRESENT if it was PENDING. 
            // If it was LATE, keep it LATE.
            // If it was ABSENT (due to late strike), keep it ABSENT.
            if (newStatus === "PENDING") {
                newStatus = "PRESENT";
            }
        }

        const updated = await prisma.attendance.update({
            where: { id: record.id },
            data: {
                logoutTime: now,
                status: newStatus,
                adminRemarks: newRemarks
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
