import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addHours, isAfter } from "date-fns";

export async function POST(req: Request) {
    try {
        const { userId, faceDescriptor } = await req.json();

        if (!userId || !faceDescriptor) {
            return NextResponse.json({ success: false, error: "Missing data" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // Check Lockout
        if (user.lockoutUntil && isAfter(new Date(user.lockoutUntil), new Date())) {
            const diff = new Date(user.lockoutUntil).getTime() - new Date().getTime();
            const hoursLeft = Math.ceil(diff / (1000 * 60 * 60));
            return NextResponse.json({
                success: false,
                error: `Account locked due to too many failed attempts. Try again in ${hoursLeft} hours or contact admin.`,
                locked: true
            }, { status: 403 });
        }

        const descriptorArray = Object.values(faceDescriptor) as number[];

        // 1. First time registration
        if (!user.faceDescriptor) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    faceDescriptor: JSON.stringify(descriptorArray),
                    failedFaceAttempts: 0
                }
            });
            return NextResponse.json({ success: true, message: "Face registered successfully" });
        }

        // 2. Verification
        const storedDescriptor = JSON.parse(user.faceDescriptor) as number[];
        const distance = euclideanDistance(descriptorArray, storedDescriptor);

        // Threshold for face-api.js is usually 0.6. Lower is stricter.
        const THRESHOLD = 0.5;

        if (distance < THRESHOLD) {
            // Success
            await prisma.user.update({
                where: { id: userId },
                data: { failedFaceAttempts: 0 }
            });
            return NextResponse.json({ success: true, message: "Face verified" });
        } else {
            // Fail
            const newFailCount = user.failedFaceAttempts + 1;

            if (newFailCount >= 5) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        failedFaceAttempts: newFailCount,
                        lockoutUntil: addHours(new Date(), 48)
                    }
                });
                return NextResponse.json({
                    success: false,
                    error: "Face not recognized. Account LOCKED for 48 hours due to 5 failed attempts.",
                    locked: true
                }, { status: 403 });
            } else {
                await prisma.user.update({
                    where: { id: userId },
                    data: { failedFaceAttempts: newFailCount }
                });
                return NextResponse.json({
                    success: false,
                    error: `Face not recognized. Warning: ${5 - newFailCount} attempts remaining before lockout.`,
                    attemptsLeft: 5 - newFailCount
                }, { status: 401 });
            }
        }

    } catch (error) {
        console.error("Face Auth Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

function euclideanDistance(arr1: number[], arr2: number[]): number {
    if (arr1.length !== arr2.length) return 1.0; // Max distance if mismatch
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
        sum += (arr1[i] - arr2[i]) ** 2;
    }
    return Math.sqrt(sum);
}
