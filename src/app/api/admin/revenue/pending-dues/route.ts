import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pendingUsers = await prisma.user.findMany({
            where: {
                pendingAmount: {
                    gt: 0
                }
            },
            select: {
                id: true,
                name: true,
                mobile: true,
                course: true,
                totalFees: true,
                paidAmount: true,
                pendingAmount: true
            },
            orderBy: {
                pendingAmount: 'desc'
            }
        });

        const totalPending = pendingUsers.reduce((sum, user) => sum + (user.pendingAmount || 0), 0);

        return NextResponse.json({
            success: true,
            users: pendingUsers,
            total: totalPending
        });
    } catch (error) {
        console.error("Error fetching pending dues:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch pending dues" }, { status: 500 });
    }
}
