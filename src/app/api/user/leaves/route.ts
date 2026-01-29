import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

        const leave = await prisma.leave.create({
            data: {
                userId,
                startDate,
                endDate,
                reason,
                type: type || "CL",
                status: "PENDING",
                isHalfDay: halfDayBool
            }
        });

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
