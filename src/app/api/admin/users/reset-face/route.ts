import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { userId, action } = await req.json();

        if (!userId) {
            return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
        }

        const updateData: any = {
            failedFaceAttempts: 0,
            lockoutUntil: null
        };

        if (action === 'reset') {
            updateData.faceDescriptor = null; // Actually delete face data
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        return NextResponse.json({ success: true, message: "Face registration reset successfully" });
    } catch (error) {
        console.error("Reset Face Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
