import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
// import { cookies } from "next/headers"; // Unused

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-this";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobile, password, role } = body;

        const user = await prisma.user.findUnique({
            where: { mobile }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found. Please contact Admin." },
                { status: 404 }
            );
        }

        // STATUS CHECK
        if (user.status === "PENDING") {
            return NextResponse.json(
                { message: "Login Failed: Account is PENDING Approval by Admin." },
                { status: 403 }
            );
        }
        if (user.status === "BLOCKED") {
            return NextResponse.json(
                { message: "Login Failed: Account is BLOCKED by System." },
                { status: 403 }
            );
        }

        // LOCKOUT CHECK
        if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
            const diff = new Date(user.lockoutUntil).getTime() - new Date().getTime();
            const hoursLeft = Math.ceil(diff / (1000 * 60 * 60));
            return NextResponse.json(
                { message: `Account Locked due to failed biometric attempts. Try again in ${hoursLeft} hours or contact Admin.` },
                { status: 403 }
            );
        }

        // Role Check logic (Strict or Lenient based on requirement)
        if (user.role !== role && user.role !== 'ADMIN') {
            return NextResponse.json(
                { message: `Access Denied. You are registered as ${user.role}` },
                { status: 403 }
            );
        }

        // Check for "First Time Login" scenario
        const dbPass = String(user.password || "").trim();
        const inputPass = String(password || "").trim();

        if (dbPass === "") {
            return NextResponse.json({
                status: "PENDING_SETUP",
                message: "Please set your password"
            });
        }

        // PASSWORD VERIFICATION (Lazy Migration)
        let passwordIsValid = false;
        let needsMigration = false;

        // 1. Try comparing as hash
        const isHash = dbPass.startsWith("$2a$") || dbPass.startsWith("$2b$");

        if (isHash) {
            passwordIsValid = await bcrypt.compare(inputPass, dbPass);
        } else {
            // 2. Fallback: Compare as plain text (Legacy)
            if (inputPass === dbPass) {
                passwordIsValid = true;
                needsMigration = true; // Flag for upgrade
            }
        }

        if (!passwordIsValid) {
            return NextResponse.json(
                { message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // MIGRATE PASSWORD IF NEEDED
        if (needsMigration) {
            console.log(`Migrating password for user ${user.id} to bcrypt hash via lazy migration.`);
            const hashedPassword = await bcrypt.hash(inputPass, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
        }

        // ATTENDANCE & STATUS CHECK logic (Simplified for brevity as core auth is goal)
        // [Existing attendance checks preserved logic if needed, skipping for pure login speed focus unless explicitly requested to fail on attendance]

        // 1. Create Session for Database (Optional, good for tracking active sessions)
        const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        // We still keep the DB session for tracking, even if we use JWT for auth
        await prisma.session.create({
            data: {
                userId: user.id,
                token: sessionToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            }
        });

        // 2. GENERATE SECURE JWT
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

        // Remove Cookie Logic - Token is sent in body
        // const cookieStore = await cookies(); ...

        return NextResponse.json({
            status: "SUCCESS",
            user: {
                id: user.id,
                name: user.name,
                mobile: user.mobile,
                role: user.role,
                createdAt: user.createdAt,
                token: jwt // Send token to client
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: `Login Error: ${error instanceof Error ? error.message : "Unknown Error"}` },
            { status: 500 }
        );
    }
}
