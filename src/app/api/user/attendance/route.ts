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

        if (type === 'stats') {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const today = now.toISOString().split('T')[0];

            // Get all records for this month
            const monthlyRecords = await prisma.attendance.findMany({
                where: {
                    userId,
                    date: { gte: firstDay, lte: today }
                }
            });

            // Count Present (PRESENT or LATE)
            const presentDays = monthlyRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;

            // Calculate total days elapsed (simple count of days passed)
            // A more accurate way would be to count working days, but for now we'll use calendar days excluding Sundays if possible, 
            // or just simple present count if that's what user expects.
            // Let's used Days Elapsed (Calendar Days) for the denominator to show "Consistency"
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const diffTime = Math.abs(now.getTime() - start.getTime());
            const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include today

            const percentage = daysElapsed > 0 ? (presentDays / daysElapsed) * 100 : 0;

            return NextResponse.json({
                percentage: parseFloat(percentage.toFixed(1)),
                presentDays,
                totalDays: daysElapsed,
                month: now.toLocaleString('default', { month: 'long' })
            });
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
        const { userId, action } = body;
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // --- MISTAKEN CHECKOUT CORRECTION ---
        if (action === 'correct') {
            const record = await prisma.attendance.findFirst({
                where: { userId, date: today }
            });

            if (!record || !record.logoutTime) {
                return NextResponse.json({ message: "No checkout to correct" }, { status: 400 });
            }

            // Check Limit (4 times per month)
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const correctionCount = await prisma.systemLog.count({
                where: {
                    userId,
                    action: 'ATTENDANCE_CORRECTION',
                    timestamp: { gte: firstDayOfMonth }
                }
            });

            if (correctionCount >= 4) {
                return NextResponse.json({ message: "Monthly correction limit reached (4/4)" }, { status: 403 });
            }

            // Restore Status (Logic: If it was PRESENT/LATE, keep it. If it became ABSENT due to early leave, revert to calculated check-in status)
            const deadline = new Date(record.loginTime);
            deadline.setHours(10, 45, 0, 0);

            let originalStatus = "PRESENT";
            if (new Date(record.loginTime) > deadline) {
                originalStatus = "LATE";
                // If it was ABSENT due to strikes, it would have been ABSENT in db. 
                // But we can just trust if it's currently ABSENT and remarks contain "Early Leave", we revert.
                // Simpler: Just revert to PRESENT or LATE based on time.
            }

            // Clean remarks
            let newRemarks = record.adminRemarks ? record.adminRemarks.replace(", Early Leave (<4h)", "").replace("Early Leave (<4h)", "") : "";

            // Log it
            await prisma.systemLog.create({
                data: {
                    userId,
                    action: 'ATTENDANCE_CORRECTION',
                    details: `Resumed day for ${today}`
                }
            });

            const updated = await prisma.attendance.update({
                where: { id: record.id },
                data: {
                    logoutTime: null,
                    status: originalStatus, // Reset to calculated status
                    adminRemarks: newRemarks
                }
            });

            return NextResponse.json({ ...updated, correctionCount: correctionCount + 1 });
        }

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
