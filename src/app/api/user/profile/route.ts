
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { userId, parentName, parentMobile, parentEmail } = body;

        if (!userId) {
            return NextResponse.json({ success: false, message: "UserId required" }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                parentName,
                parentMobile,
                parentEmail
            }
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
