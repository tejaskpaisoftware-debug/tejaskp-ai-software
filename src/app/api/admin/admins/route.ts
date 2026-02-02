import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET: List all Admins
export async function GET() {
    try {
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: {
                id: true,
                name: true,
                mobile: true,
                role: true,
                createdAt: true,
                faceDescriptor: true, // Check if enrolled
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

// POST: Create New Sub-Admin
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, mobile, password } = body;

        if (!name || !mobile || !password) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { mobile } });
        if (existing) {
            return NextResponse.json({ message: "User already exists with this mobile" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await prisma.user.create({
            data: {
                name,
                mobile,
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                employeeId: `ADM-${Math.floor(1000 + Math.random() * 9000)}`
            }
        });

        return NextResponse.json(newAdmin);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error creating admin" }, { status: 500 });
    }
}
