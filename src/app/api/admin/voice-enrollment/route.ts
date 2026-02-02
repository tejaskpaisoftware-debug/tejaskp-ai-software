import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const passphrase = formData.get("passphrase") as string;
        const userId = formData.get("userId") as string;

        if (!file || !passphrase || !userId) {
            return NextResponse.json({ message: "Missing file, passphrase, or userId" }, { status: 400 });
        }

        // 1. Validate User is Admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Unauthorized. Admin access required." }, { status: 403 });
        }

        // 2. Save File
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public", "uploads", "voice");

        // Ensure dir exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `voice_${userId}_${Date.now()}.wav`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        // 3. Update Database
        await prisma.user.update({
            where: { id: userId },
            data: {
                voicePassphrase: passphrase.toLowerCase().trim(),
                voiceAudioPath: `/uploads/voice/${fileName}`
            }
        });

        return NextResponse.json({
            success: true,
            message: "Voice enrolled successfully",
            path: `/uploads/voice/${fileName}`
        });

    } catch (error: any) {
        console.error("Voice enrollment error details:", error);
        return NextResponse.json({
            message: "Internal server error",
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
