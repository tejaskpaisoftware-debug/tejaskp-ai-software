import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobile, ...data } = body;

        if (!mobile) {
            return NextResponse.json({ message: "Mobile number required" }, { status: 400 });
        }

        try {
            await prisma.user.update({
                where: { mobile },
                data: {
                    ...data,
                    name: data.name ? data.name.toUpperCase() : undefined,
                }
            });
            return NextResponse.json({ message: "User updated successfully" });
        } catch (e: any) {
            if (e.code === 'P2002') {
                return NextResponse.json({ message: "Mobile or Email already exists" }, { status: 409 });
            }
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
