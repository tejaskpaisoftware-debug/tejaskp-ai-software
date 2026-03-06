import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-server";

export async function GET() {
    try {
        const auth = await getAuthUser();

        let whereClause = {};

        // If Role is TEAM_LEAD, only show students from their same department
        if (auth && auth.role === "TEAM_LEAD") {
            const lead = await prisma.user.findUnique({
                where: { id: auth.userId },
                select: { department: true }
            });

            whereClause = {
                role: "STUDENT",
                department: lead?.department || undefined
            };
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                leaves: true,
                salarySlips: true,
                joiningLetters: true
            }
        });
        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
