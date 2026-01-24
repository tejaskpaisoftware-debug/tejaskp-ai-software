import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobile, status } = body;

        try {
            await prisma.user.update({
                where: { mobile },
                data: { status: status }
            });

            return NextResponse.json({ message: `User status updated to ${status}` });
        } catch (e) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error("Error updating status:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
