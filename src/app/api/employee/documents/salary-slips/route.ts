import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { message: "User ID is required" },
                { status: 400 }
            );
        }

        const salarySlips = await prisma.salarySlip.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                year: 'desc'
            }
        });

        return NextResponse.json(salarySlips);

    } catch (error) {
        console.error("Error fetching salary slips:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
