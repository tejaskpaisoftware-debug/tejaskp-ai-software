
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSunday, isBefore, isAfter } from "date-fns";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month"); // "YYYY-MM"
        const userId = searchParams.get("userId");

        if (!month) {
            return NextResponse.json({ message: "Month (YYYY-MM) is required" }, { status: 400 });
        }

        const [year, monthIdx] = month.split("-").map(Number);
        const startDate = startOfMonth(new Date(year, monthIdx - 1));
        const endDate = endOfMonth(startDate);
        const today = new Date();

        // 1. Fetch Students
        const students = await prisma.user.findMany({
            where: userId ? { id: userId } : { role: "STUDENT" },
            select: {
                id: true,
                name: true,
                mobile: true,
                parentName: true,
                parentMobile: true
            }
        });

        const report = await Promise.all(students.map(async (student) => {
            // 2. Fetch Attendance for the month
            const attendance = await prisma.attendance.findMany({
                where: {
                    userId: student.id,
                    date: {
                        gte: format(startDate, 'yyyy-MM-dd'),
                        lte: format(endDate, 'yyyy-MM-dd')
                    }
                }
            });

            // 3. Fetch Tasks for the month
            const tasks = await prisma.task.findMany({
                where: {
                    assignedToId: student.id,
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            // 4. Compile statistics
            const stats = {
                present: attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length,
                late: attendance.filter(a => a.status === 'LATE').length,
                absent: attendance.filter(a => a.status === 'ABSENT').length,
                totalDays: eachDayOfInterval({ start: startDate, end: isBefore(endDate, today) ? endDate : today })
                    .filter(d => !isSunday(d)).length,
                daysWithNoTask: 0
            };

            // Calculate days with no task
            const interval = eachDayOfInterval({
                start: startDate,
                end: isBefore(endDate, today) ? endDate : today
            }).filter(d => !isSunday(d));

            stats.daysWithNoTask = interval.filter(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const hasTask = tasks.some(t => format(new Date(t.createdAt), 'yyyy-MM-dd') === dayStr);
                const attended = attendance.some(a => a.date === dayStr && (a.status === 'PRESENT' || a.status === 'LATE'));
                return attended && !hasTask;
            }).length;

            return {
                studentId: student.id,
                name: student.name,
                parentContact: {
                    name: student.parentName,
                    mobile: student.parentMobile
                },
                stats,
                attendance: attendance.map(a => ({
                    date: a.date,
                    status: a.status,
                    loginTime: a.loginTime,
                    logoutTime: a.logoutTime
                }))
            };
        }));

        return NextResponse.json({ success: true, report });

    } catch (error) {
        console.error("Report generation error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
