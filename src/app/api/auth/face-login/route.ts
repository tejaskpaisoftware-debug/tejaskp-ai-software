import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addHours, isAfter } from "date-fns";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-this";

export async function POST(req: Request) {
    try {
        const { faceDescriptor } = await req.json();

        if (!faceDescriptor) {
            return NextResponse.json({ success: false, error: "Missing face data" }, { status: 400 });
        }

        const descriptorArray = Object.values(faceDescriptor) as number[];

        // 1. Fetch all users who HAVE a registered face
        const users = await prisma.user.findMany({
            where: {
                faceDescriptor: { not: null },
                status: "APPROVED" // Only approved users can login
            }
        });

        let bestMatch = null;
        let minDistance = Infinity;
        const THRESHOLD = 0.6; // Relaxed threshold for better identification

        for (const user of users) {
            // Check if user is locked out
            if (user.lockoutUntil && isAfter(new Date(user.lockoutUntil), new Date())) {
                continue; // Skip locked users to prevent brute force/mistakes
            }

            const storedDescriptor = JSON.parse(user.faceDescriptor as string) as number[];
            const distance = euclideanDistance(descriptorArray, storedDescriptor);

            if (distance < minDistance && distance < THRESHOLD) {
                minDistance = distance;
                bestMatch = user;
            }
        }

        if (!bestMatch) {
            return NextResponse.json({ success: false, error: "Face not recognized. Please sign in with mobile/password first." }, { status: 401 });
        }

        const user = bestMatch;

        // 2. GENERATE SESSION (Synchronized with api/auth/login)
        const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await prisma.session.create({
            data: {
                userId: user.id,
                token: sessionToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        });

        const secret = new TextEncoder().encode(JWT_SECRET);
        const jwt = await new SignJWT({
            userId: user.id,
            role: user.role,
            name: user.name
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret);

        return NextResponse.json({
            success: true,
            status: "SUCCESS",
            message: "Face Login Successful!",
            user: {
                id: user.id,
                name: user.name,
                mobile: user.mobile,
                role: user.role,
                createdAt: user.createdAt,
                token: jwt
            }
        });

    } catch (error) {
        console.error("Face Login Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

function euclideanDistance(arr1: number[], arr2: number[]): number {
    if (arr1.length !== arr2.length) return 1.0;
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
        sum += (arr1[i] - arr2[i]) ** 2;
    }
    return Math.sqrt(sum);
}
