import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-server";

export async function GET(request: Request) {
    try {
        const auth = await getAuthUser();
        const { searchParams } = new URL(request.url);

        const queryYear = searchParams.get('year');
        const currentYear = new Date().getFullYear();
        let selectedYear = queryYear ? parseInt(queryYear) : currentYear;

        // Handle NaN or invalid years
        if (isNaN(selectedYear)) {
            selectedYear = currentYear;
        }

        const startOfYear = new Date(selectedYear, 0, 1);
        const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

        // Clamp to current date if viewing current year to avoid future predictions
        const queryEndDate = selectedYear === currentYear ? new Date() : endOfYear;

        let whereClause: any = {};
        if (auth && auth.role === "TEAM_LEAD") {
            const lead = await prisma.user.findUnique({ where: { id: auth.userId }, select: { department: true } });
            whereClause.department = lead?.department || undefined;
        }


        // 1. Fetch Data
        const [revenueAgg, totalUsers, activeToday, invoices] = await Promise.all([
            // Total Revenue (All Time)
            prisma.invoice.aggregate({
                _sum: { paidAmount: true }
            }),

            // Total Users
            prisma.user.count({
                where: {
                    role: "STUDENT",
                    department: whereClause.department
                }
            }),

            // Active Today (Attendance)
            prisma.attendance.count({
                where: {
                    date: new Date().toISOString().split('T')[0],
                    user: {
                        role: "STUDENT",
                        department: whereClause.department
                    }
                }
            }),

            // Invoices for Graph (Selected Year)
            prisma.invoice.findMany({
                where: {
                    createdAt: { gte: startOfYear, lte: queryEndDate },
                    user: whereClause.department ? { department: whereClause.department } : undefined
                },
                select: { createdAt: true, paidAmount: true }
            })
        ]);

        // 1.1 Calculate Pending
        const pendingAgg = await prisma.user.aggregate({
            _sum: { pendingAmount: true },
            where: {
                pendingAmount: { gt: 0 },
                role: "STUDENT",
                department: whereClause.department
            }
        });

        const totalPending = pendingAgg._sum.pendingAmount || 0;

        // 2. Process Graph Data (Monthly Trend)
        const monthlyRevenue = new Array(12).fill(0);
        invoices.forEach(inv => {
            const date = new Date(inv.createdAt);
            const monthIndex = date.getMonth(); // 0-11
            monthlyRevenue[monthIndex] += (inv.paidAmount || 0);
        });

        // 3. Stats
        const totalRevenue = revenueAgg._sum.paidAmount || 0;
        const revenueGrowth = "+12%"; // Placeholder logic for now

        return NextResponse.json({
            success: true,
            stats: {
                revenue: totalRevenue,
                users: totalUsers,
                activeSessions: activeToday,
                revenueGrowth,
                usersGrowth: "+5%",
                pendingAmount: totalPending,
                graph: monthlyRevenue // Array of 12 numbers
            }
        });

    } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
    }
}
