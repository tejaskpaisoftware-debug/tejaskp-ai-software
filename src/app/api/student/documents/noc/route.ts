import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to get user from auth header (Basic implementation matching dashboard)
// In a real app, middleware handles this. Here we trust the client sends userId or we check session.
// For this route, we'll expect userId in the formData or verify session if possible.
// But mostly we rely on the frontend sending the ID for now as per the student dashboard pattern.

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        if (!file || !userId) {
            return NextResponse.json({ error: "File and UserId are required" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Vercel/Serverless Fix: Filesystem is read-only.
        // We will store the file as a Base64 Data URI in the database.
        // NOTE: This creates large DB records. For production scaling, use S3/Blob storage.
        const base64Data = buffer.toString("base64");
        const fileUrl = `data:${file.type};base64,${base64Data}`;

        // Create DB Record
        const doc = await prisma.studentDocument.create({
            data: {
                userId,
                type: "NOC",
                fileUrl: fileUrl, // Storing entire file in DB column
                fileName: file.name,
                status: "PENDING"
            }
        });

        return NextResponse.json({ success: true, document: doc });

    } catch (error: any) {
        console.error("NOC Upload Error:", error);
        return NextResponse.json({ error: "Failed to upload NOC" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "UserId required" }, { status: 400 });
        }

        const doc = await prisma.studentDocument.findFirst({
            where: {
                userId,
                type: "NOC"
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, document: doc });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch NOC status" }, { status: 500 });
    }
}
