import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { role, fullName, mobile, email, details, address, joiningDate } = body;

        // Check if user exists (Mobile)
        const existingUserMobile = await prisma.user.findUnique({
            where: { mobile }
        });

        if (existingUserMobile) {
            return NextResponse.json(
                { message: "User with this Mobile Number already exists." },
                { status: 400 }
            );
        }

        // Check if user exists (Email) - Only if email is provided
        if (email) {
            const existingUserEmail = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUserEmail) {
                return NextResponse.json(
                    { message: "User with this Email ID already exists." },
                    { status: 400 }
                );
            }
        }

        // Hash password if provided (optional at registration)

        console.log("Creating user:", { fullName, mobile, role, joiningDate });

        // Calculate timestamps
        // If joiningDate is provided, use it for createdAt as well to backdate the entry
        const creationTime = joiningDate ? new Date(joiningDate) : new Date();

        // Create User
        const newUser = await prisma.user.create({
            data: {
                role: role,
                name: fullName.toUpperCase(), // Map fullName to name
                mobile,
                email: email || null,
                college: (role === 'STUDENT' && address) ? address : null,
                // University removed from here to prevent Stale Client error
                details: details || address || "",
                password: "", // Empty means pending setup
                status: "PENDING",
                joiningDate: joiningDate || null, // Store explicit joining date
                createdAt: creationTime // Backdate creation if needed
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

        return NextResponse.json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
