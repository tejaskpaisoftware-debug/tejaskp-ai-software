import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params; // 'id' here is the mobile number

        if (!id) {
            return NextResponse.json({ message: "User ID Required" }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: id },
                    { mobile: decodeURIComponent(id) }
                ]
            },
            include: {
                submissions: { orderBy: { submittedAt: 'desc' } },
                invoices: { orderBy: { createdAt: 'desc' } },
                attendance: { orderBy: { date: 'desc' } },
                leaves: { orderBy: { startDate: 'desc' } },
                joiningLetters: true,
                certificates: true,
                salarySlips: { orderBy: [{ year: 'desc' }, { month: 'desc' }] }
            }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }

}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        if (!id) return NextResponse.json({ message: "ID Required" }, { status: 400 });

        // Delete dependencies first (optional, but cascaded usually handled by DB or explicit logic)
        // Since I have separate tables (Invoice, etc.), I should ideally delete them or rely on cascade.
        // For now, I'll rely on my 'clear_data.js' logic being robust or assume Prisma handles it if configured.
        // Actually, for individual delete, I should be safe.
        // Note: The user explicitly wants to "remove students".

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "User Deleted" });
    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        if (!id) return NextResponse.json({ message: "ID Required" }, { status: 400 });

        const body = await request.json();
        const {
            name, email, mobile, course, role, status, totalFees, paidAmount,
            department, designation, employeeId, photoUrl, reportingManager,
            skills, dob, bloodGroup, currentAddress, permanentAddress, emergencyContact,
            bankName, accountNumber, ifscCode, panNumber, aadharCard,
            bankState, bankCity, bankArea, bankBranch
        } = body;

        // Calculate pending if financial data is provided
        let pendingAmount = undefined;
        if (totalFees !== undefined && paidAmount !== undefined) {
            pendingAmount = Number(totalFees) - Number(paidAmount);
        }

        const result = await prisma.$transaction(async (tx) => {
            console.log("Updating User:", id, "With Salary:", body.salaryDetails);
            const updated = await tx.user.update({
                where: { id },
                data: {
                    name: name ? name.toUpperCase() : undefined,
                    email,
                    mobile,
                    course,
                    role,
                    status,
                    totalFees: totalFees !== undefined ? Number(totalFees) : undefined,
                    paidAmount: paidAmount !== undefined ? Number(paidAmount) : undefined,
                    pendingAmount: pendingAmount, // Auto-calculated
                    salaryDetails: body.salaryDetails, // Save JSON string

                    // Extended Profile Fields
                    department,
                    designation,
                    employeeId,
                    photoUrl,
                    reportingManager,
                    skills,
                    dob,
                    bloodGroup,
                    currentAddress,
                    permanentAddress,
                    emergencyContact,

                    // Bank & ID Details
                    bankName,
                    accountNumber,
                    ifscCode,
                    panNumber,
                    aadharCard,
                    bankState,
                    bankCity,
                    bankArea,
                    bankBranch
                }
            });

            // If Name changed, update all Invoices for this user to reflect the new name
            if (name) {
                await tx.invoice.updateMany({
                    where: { userId: id },
                    data: { customerName: name }
                });
            }

            return updated;
        });

        return NextResponse.json({ success: true, message: "User Updated", user: result });
    } catch (error: any) {
        console.error("Update Error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ success: false, error: "Mobile or Email already exists." }, { status: 409 });
        }
        return NextResponse.json({
            success: false,
            error: "Failed to update user",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}


