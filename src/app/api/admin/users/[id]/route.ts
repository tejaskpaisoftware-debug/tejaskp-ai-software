import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params; // 'id' here is the mobile number
        const auth = await getAuthUser();

        if (!id) {
            return NextResponse.json({ message: "User ID Required" }, { status: 400 });
        }

        // 1. Fetch User First
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

        // 2. Role Check: Team Lead restriction
        if (auth && auth.role === "TEAM_LEAD") {
            const lead = await prisma.user.findUnique({
                where: { id: auth.userId },
                select: { department: true }
            });

            if (user.role !== "STUDENT" || user.department !== lead?.department) {
                return NextResponse.json({ message: "Unauthorized: Domain Restriction" }, { status: 403 });
            }
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
        const auth = await getAuthUser();
        if (!id) return NextResponse.json({ message: "ID Required" }, { status: 400 });

        // Role Check: Team Lead cannot delete or can only delete their own students?
        // User said "they should only see students from the Web Development domain... They must not see students from other domains."
        // Usually, deletion is Admin-only, but let's check current user role.
        if (auth && auth.role === "TEAM_LEAD") {
            const lead = await prisma.user.findUnique({ where: { id: auth.userId }, select: { department: true } });
            const target = await prisma.user.findUnique({ where: { id }, select: { department: true, role: true } });
            if (!target || target.role !== "STUDENT" || target.department !== lead?.department) {
                return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
            }
        }


        // Delete dependencies first sequentially to avoid transaction timeouts
        await prisma.attendance.deleteMany({ where: { userId: id } });
        await prisma.studentDocument.deleteMany({ where: { userId: id } });
        await prisma.leave.deleteMany({ where: { userId: id } });
        await prisma.leaveBalance.deleteMany({ where: { userId: id } });
        await prisma.certificate.deleteMany({ where: { userId: id } });
        await prisma.invoice.deleteMany({ where: { userId: id } });
        await prisma.joiningLetter.deleteMany({ where: { userId: id } });
        await prisma.salarySlip.deleteMany({ where: { userId: id } });
        await prisma.session.deleteMany({ where: { userId: id } });
        await prisma.systemLog.deleteMany({ where: { userId: id } });
        await prisma.submission.deleteMany({ where: { userId: id } });
        await prisma.notification.deleteMany({ where: { userId: id } });
        await prisma.referral.deleteMany({ where: { referrerId: id } });
        await prisma.message.deleteMany({ where: { senderId: id } });
        await prisma.task.deleteMany({ where: { assignedToId: id } });

        // Ensure Mailbox deletion if it exists
        const mailbox = await prisma.mailbox.findUnique({ where: { userId: id } });
        if (mailbox) {
            // Delete associated email recipients & emails tied to the mailbox
            await prisma.emailRecipient.deleteMany({ where: { mailboxId: mailbox.id } });
            await prisma.email.deleteMany({ where: { senderId: mailbox.id } });
            await prisma.mailbox.delete({ where: { userId: id } });
        }

        // Finally, delete the User
        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "User Deleted" });
    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const auth = await getAuthUser();
        if (!id) return NextResponse.json({ message: "ID Required" }, { status: 400 });

        // Role Check
        if (auth && auth.role === "TEAM_LEAD") {
            const lead = await prisma.user.findUnique({ where: { id: auth.userId }, select: { department: true } });
            const target = await prisma.user.findUnique({ where: { id }, select: { department: true, role: true } });
            if (!target || target.role !== "STUDENT" || target.department !== lead?.department) {
                return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
            }
        }


        const body = await request.json();
        const {
            name, email, mobile, parentMobile, course, role, status, totalFees, paidAmount,
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
                    parentMobile,
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


