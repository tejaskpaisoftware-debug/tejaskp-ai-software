import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthUser();
        const adminId = auth?.userId;
        if (!adminId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = id;

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, createdAt: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Generate the last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 29); // 30 days including today

        // Fetch actual attendance records
        const records = await prisma.attendance.findMany({
            where: {
                userId,
                date: {
                    gte: thirtyDaysAgo.toISOString().split('T')[0],
                    lte: today.toISOString().split('T')[0]
                }
            },
            select: {
                id: true,
                date: true,
                status: true,
                loginTime: true,
                logoutTime: true
            },
            orderBy: { date: 'asc' }
        });

        // Map records by date for easy lookup
        const recordsByDate = records.reduce((acc: any, record) => {
            acc[record.date] = record;
            return acc;
        }, {});

        const chartData = [];
        const userCreatedAt = new Date(user.createdAt).getTime();

        for (let i = 0; i < 30; i++) {
            const d = new Date(thirtyDaysAgo);
            d.setDate(thirtyDaysAgo.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const isSunday = d.getDay() === 0;

            const record = recordsByDate[dateStr];

            if (record) {
                // If they checked in, use that status
                chartData.push({
                    id: record.id,
                    date: dateStr,
                    status: record.status, // PRESENT, LATE, ABSENT
                    loginTime: record.loginTime,
                    logoutTime: record.logoutTime,
                    isSunday
                });
            } else {
                // If there's no record
                // 1. Was it before they joined?
                if (d.getTime() < userCreatedAt) {
                    chartData.push({ date: dateStr, status: 'NOT_JOINED', isSunday });
                }
                // 2. Is it a Sunday? (Usually days off, default to None/Weekend)
                else if (isSunday) {
                    chartData.push({ date: dateStr, status: 'WEEKEND', isSunday });
                }
                // 3. Otherwise, they missed check-in -> ABSENT
                else {
                    chartData.push({ date: dateStr, status: 'ABSENT', isSunday });
                }
            }
        }

        return NextResponse.json({ chartData });

    } catch (error: any) {
        console.error("Attendance Chart API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
