import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobile, password } = body;

        try {
            await prisma.user.update({
                where: { mobile },
                data: { password }
            });
            return NextResponse.json({ message: "Password updated successfully" });
        } catch (e) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error("Set password error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
