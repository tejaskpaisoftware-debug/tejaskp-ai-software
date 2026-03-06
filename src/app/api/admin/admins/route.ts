import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET: List all Admins and Team Leads
export async function GET() {
    try {
        const admins = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'TEAM_LEAD', 'DEVELOPMENT_MANAGER'] } },
            select: {
                id: true,
                name: true,
                mobile: true,
                role: true,
                createdAt: true,
                faceDescriptor: true, // Check if enrolled
                voicePassphrase: true,
                status: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform to hide raw descriptor but show enrollment status
        const safeAdmins = admins.map(admin => ({
            ...admin,
            isFaceEnrolled: !!admin.faceDescriptor,
            faceDescriptor: undefined
        }));

        return NextResponse.json(safeAdmins);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching admins" }, { status: 500 });
    }
}

// POST: Create New Administrative User (Defaults to TEAM_LEAD)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, mobile, password, role = 'TEAM_LEAD' } = body;

        if (!name || !mobile || !password) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { mobile } });
        if (existing) {
            // Elevation logic: If user exists, upgrade their role
            const updated = await prisma.user.update({
                where: { mobile },
                data: {
                    role: role,
                    // If they don't have an employeeId yet, give them one
                    employeeId: existing.employeeId || `${role === 'ADMIN' ? 'ADM' : role === 'DEVELOPMENT_MANAGER' ? 'DM' : 'TL'}-${Math.floor(1000 + Math.random() * 9000)}`
                }
            });
            return NextResponse.json({ ...updated, info: "Existing user upgraded" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await prisma.user.create({
            data: {
                name,
                mobile,
                password: hashedPassword,
                role: role,
                status: 'ACTIVE',
                employeeId: `${role === 'ADMIN' ? 'ADM' : role === 'DEVELOPMENT_MANAGER' ? 'DM' : 'TL'}-${Math.floor(1000 + Math.random() * 9000)}`
            }
        });

        return NextResponse.json(newAdmin);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error creating admin" }, { status: 500 });
    }
}

// DELETE: Remove Administrative User
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ message: "Missing User ID" }, { status: 400 });
        }

        // We don't delete the user entirely if they have dependencies, 
        // but for Admins/TLs we usually want to revoke access.
        // If the user wants a full wipe, we'd use the user delete route.
        // For now, let's just delete the user as requested by the Admin Validation page.

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ message: "User removed successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error removing user" }, { status: 500 });
    }
}
