import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobile } = body;

        try {
            await prisma.user.delete({
                where: { mobile }
            });
            return NextResponse.json({ message: "User deleted successfully" });
        } catch (e) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
