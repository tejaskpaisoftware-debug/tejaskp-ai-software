import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { role, fullName, mobile, email, details, address, joiningDate, department, username, password } = body;

        const cleanMobile = String(mobile || "").trim();
        const cleanUsername = username ? String(username).trim() : null;
        const cleanEmail = email ? String(email).trim() : null;

        if (!cleanMobile) {
            return NextResponse.json(
                { message: "Mobile Number is required." },
                { status: 400 }
            );
        }

        // Check if user exists (Mobile)
        const existingUserMobile = await prisma.user.findUnique({
            where: { mobile: cleanMobile }
        });

        if (existingUserMobile) {
            return NextResponse.json(
                { message: "User with this Mobile Number already exists." },
                { status: 400 }
            );
        }

        // Check if username is already taken as employeeId or mobile
        if (cleanUsername) {
            const existingUsername = await prisma.user.findFirst({
                where: {
                    OR: [
                        { employeeId: cleanUsername },
                        { mobile: cleanUsername }
                    ]
                }
            });

            if (existingUsername) {
                return NextResponse.json(
                    { message: `Username "${cleanUsername}" is already taken. Please choose another.` },
                    { status: 400 }
                );
            }
        }

        // Check if user exists (Email) - Only if email is provided
        if (cleanEmail) {
            const existingUserEmail = await prisma.user.findUnique({
                where: { email: cleanEmail }
            });

            if (existingUserEmail) {
                return NextResponse.json(
                    { message: "User with this Email ID already exists." },
                    { status: 400 }
                );
            }
        }

        // Hash password if provided
        let hashedPassword = "";
        if (password && String(password).trim().length > 0) {
            hashedPassword = await bcrypt.hash(String(password).trim(), 10);
        }

        console.log("Creating user:", { fullName, mobile: cleanMobile, username: cleanUsername, role, joiningDate });

        // Calculate timestamps
        // If joiningDate is provided, use it for createdAt as well to backdate the entry
        const creationTime = joiningDate ? new Date(joiningDate) : new Date();

        // Create User - Set status to ACTIVE so student/user can immediately login
        const cleanDepartment = department ? String(department).trim() : null;

        const newUser = await prisma.user.create({
            data: {
                role: role,
                name: (fullName || "").toUpperCase(),
                mobile: cleanMobile,
                employeeId: cleanUsername || null,
                email: cleanEmail || null,
                college: (role === 'STUDENT' && address) ? address : null,
                details: details || address || "",
                password: hashedPassword,
                status: "ACTIVE", // Active so user can login without blocking
                joiningDate: joiningDate || null,
                createdAt: creationTime,
                department: cleanDepartment,
                course: cleanDepartment // For students, course/domain is set immediately
            }
        });

        // Robust Update: Use Raw SQL to save university (Bypasses stale Prisma Client cache)
        if (role === 'STUDENT' && address) {
            try {
                // @ts-ignore
                await prisma.$executeRaw`UPDATE "users" SET "university" = ${address} WHERE "id" = ${newUser.id}`;
            } catch (e) {
                console.error("Failed to update university raw:", e);
            }
        }

        return NextResponse.json({ 
            success: true,
            message: "User registered successfully",
            userId: newUser.id,
            loginIdentifier: cleanUsername || cleanMobile
        });
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
