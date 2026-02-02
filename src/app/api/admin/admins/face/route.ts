import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, faceDescriptor } = body;

        if (!userId || !faceDescriptor) {
            return NextResponse.json({ message: "Missing data" }, { status: 400 });
        }

        // Validate descriptor format (Should be array of numbers)
        if (!Array.isArray(faceDescriptor) || faceDescriptor.length === 0) {
            return NextResponse.json({ message: "Invalid face descriptor" }, { status: 400 });
        }

        // Convert array to string for storage (or float[] if using pgvector later)
        // Schema uses String? for faceDescriptor currently.
        // We usually store it as JSON string.
        const descriptorString = JSON.stringify(faceDescriptor);

        await prisma.user.update({
            where: { id: userId },
            data: {
                faceDescriptor: descriptorString,
                failedFaceAttempts: 0,
                lockoutUntil: null // Reset any lockouts
            }
        });

        return NextResponse.json({ success: true, message: "Face enrolled successfully" });

    } catch (error) {
        console.error("Face enrollment error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
