import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { writeFile, unlink } from "fs/promises";
import { spawn } from "child_process";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-this";

export async function POST(request: Request) {
    let tempFilePath = "";


    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        // const mobile = formData.get("mobile") as string; // Removed mobile dependency

        if (!file) {
            return NextResponse.json({ message: "Audio file missing" }, { status: 400 });
        }

        // 1. Fetch ALL enrolled admins (1:N Match)
        const admins = await prisma.user.findMany({
            where: {
                role: "ADMIN",
                voiceAudioPath: { not: null }
            },
            select: {
                id: true,
                voiceAudioPath: true,
                name: true,
                mobile: true, // Added mobile to select for JWT
                role: true // Added role to select for JWT
            }
        });

        if (admins.length === 0) {
            return NextResponse.json({ message: "No voice enrolled admins found" }, { status: 404 });
        }

        // 2. Save Uploaded Audio to temp file
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempDir = path.join(process.cwd(), "public", "uploads", "temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const tempFileName = `login_attempt_${Date.now()}.wav`;
        tempFilePath = path.join(tempDir, tempFileName); // Assign to outer tempFilePath
        await writeFile(tempFilePath, buffer);

        // 3. Prepare References List for Python
        const references = admins.map(admin => ({
            userId: admin.id,
            path: path.join(process.cwd(), "public", admin.voiceAudioPath as string)
        }));

        // 4. Run Python Script in Identify Mode
        const pythonScript = path.join(process.cwd(), "scripts", "voice_auth.py");
        // Arg struct: python script.py identify <candidate> <json_refs>
        const args = ["identify", tempFilePath, JSON.stringify(references)];

        const pythonProcess = spawn("python3", [pythonScript, ...args]);

        let resultString = "";
        let errorString = "";

        // Debug logging
        console.log(`[VoiceAuth] Admins found: ${admins.length}`);
        console.log(`[VoiceAuth] Temp file: ${tempFilePath}`);

        const result = await new Promise<any>((resolve, reject) => {
            pythonProcess.stdout.on("data", (data) => {
                const str = data.toString();
                console.log("[VoiceAuth] Python STDOUT:", str);
                resultString += str;
            });

            pythonProcess.stderr.on("data", (data) => {
                const str = data.toString();
                console.log("[VoiceAuth] Python STDERR:", str);
                errorString += str;
            });

            pythonProcess.on("close", (code) => {
                if (code !== 0) {
                    console.error("[VoiceAuth] Process exited with code:", code, "Error:", errorString);
                    reject(new Error(`Voice processing failed (Code ${code}). Details: ${errorString}`));
                    return;
                }

                try {
                    // Python prints JSON to stdout (find the last line that looks like JSON in case of noise)
                    const lines = resultString.trim().split('\n');
                    const jsonLine = lines[lines.length - 1]; // improved robustness
                    const jsonResponse = JSON.parse(jsonLine);
                    resolve(jsonResponse);
                } catch (e) {
                    console.error("[VoiceAuth] Invalid JSON:", resultString);
                    reject(new Error("Invalid response from verification engine"));
                }
            });
        });

        console.log("[VoiceAuth] Result:", result);

        // Normalize Score for UI (Distance -> Confidence %)
        // Distance 0 = 100%, Distance THRESHOLD = 60%, Distance > 2*THRESHOLD = 0%
        // Heuristic: Confidence = 100 * (1 - (score / (threshold * 1.5)))
        const threshold = result.threshold || 6000;
        const rawScore = result.score;
        let confidence = 0;
        if (rawScore < threshold) {
            // Strong match range (60-100%)
            confidence = 60 + (40 * (1 - (rawScore / threshold)));
        } else {
            // Weak match range (0-60%)
            confidence = Math.max(0, 60 * (1 - ((rawScore - threshold) / threshold)));
        }

        // Cap at 99.9% for display aesthetic
        confidence = Math.min(99.9, confidence);

        // 5. Handle Result
        if (result.match && result.userId) {
            // Fetch full user details for login
            const matchedUser = admins.find(admin => admin.id === result.userId);

            if (!matchedUser) {
                return NextResponse.json({ message: "Matched user not found in DB" }, { status: 401 });
            }

            // Create Token (Using Jose)
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key-change-this");
            const token = await new SignJWT({
                sub: matchedUser.id,
                role: matchedUser.role,
                mobile: matchedUser.mobile
            })
                .setProtectedHeader({ alg: "HS256" })
                .setExpirationTime("24h")
                .sign(secret);

            return NextResponse.json({
                success: true,
                status: "SUCCESS",
                token,
                score: confidence / 100, // Return as 0-1 float
                user: {
                    id: matchedUser.id,
                    name: matchedUser.name,
                    role: matchedUser.role,
                    mobile: matchedUser.mobile
                }
            });

        } else {
            return NextResponse.json({
                message: "Voice not recognized",
                score: confidence / 100,
                details: `Distance: ${Math.round(rawScore)} (Threshold: ${threshold})`
            }, { status: 401 });
        }

    } catch (error: any) {
        console.error("Voice login error details:", error);
        return NextResponse.json({
            message: "System Error during verification",
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    } finally {
        // Cleanup temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                await unlink(tempFilePath);
            } catch (e) { /* ignore */ }
        }
    }
}
