import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll("files") as File[];
        const userId = formData.get("userId") as string;

        if (!files || files.length === 0 || !userId) {
            return NextResponse.json({ error: "Files and UserId are required" }, { status: 400 });
        }

        const uploadedDocs = [];

        for (const file of files) {
            if (file.type !== "application/pdf") continue;

            const buffer = Buffer.from(await file.arrayBuffer());
            const base64Data = buffer.toString("base64");
            const fileUrl = `data:${file.type};base64,${base64Data}`;

            const doc = await (prisma as any).studentDocument.create({
                data: {
                    userId,
                    type: "ASSESSMENT",
                    fileUrl: fileUrl,
                    fileName: file.name,
                    status: "PENDING"
                }
            });
            uploadedDocs.push(doc);
        }

        return NextResponse.json({ success: true, documents: uploadedDocs });

    } catch (error: any) {
        console.error("Assessment Upload Error:", error);
        return NextResponse.json({ error: "Failed to upload assessments" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "UserId required" }, { status: 400 });
        }

        const documents = await (prisma as any).studentDocument.findMany({
            where: {
                userId,
                type: "ASSESSMENT"
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, documents });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
    }
}
