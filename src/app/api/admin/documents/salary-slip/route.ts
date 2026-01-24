import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            userId, month, year,
            basicSalary, hra, special, conveyance, medical, bonus,
            pf, professionalTax, tds, loan, otherDeductions,
            bankName, bankState, bankCity, bankArea, bankBranch, accountNumber, panNumber, ifscCode
        } = body;

        // 0. CHECK FOR EXISTING SLIP
        const existingSlip = await prisma.salarySlip.findFirst({
            where: {
                userId,
                month,
                year
            }
        });

        if (existingSlip) {
            return NextResponse.json(
                { success: false, message: `Salary slip for ${month} ${year} already exists!` },
                { status: 400 }
            );
        }

        // 1. SAVE TO DATABASE
        const slip = await prisma.salarySlip.create({
            data: {
                userId,
                month,
                year,
                basicSalary: Number(basicSalary),
                hra: Number(hra),
                special: Number(special),
                conveyance: Number(conveyance),
                medical: Number(medical),
                bonus: Number(bonus),
                pf: Number(pf),
                professionalTax: Number(professionalTax),
                tds: Number(tds),
                loan: Number(loan),
                otherDeductions: Number(otherDeductions),
                bankName,
                bankState,
                bankCity,
                bankArea,
                bankBranch,
                accountNumber,
                panNumber,
                ifscCode
            },
            include: { user: true }
        });

        // 1.1 SAve Bank Details to User Profile
        await prisma.user.update({
            where: { id: userId },
            data: {
                bankName,
                bankState,
                bankCity,
                bankArea,
                bankBranch,
                accountNumber,
                ifscCode,
                panNumber,
                salaryDetails: JSON.stringify({
                    basic: Number(basicSalary),
                    hra: Number(hra),
                    special: Number(special),
                    conveyance: Number(conveyance),
                    medical: Number(medical),
                    bonus: Number(bonus),
                    pf: Number(pf),
                    professionalTax: Number(professionalTax),
                    tds: Number(tds),
                    loan: Number(loan),
                    other: Number(otherDeductions)
                })
            }
        });

        // 2. SEND EMAIL (OPTIONAL)
        // Ideally we attach the PDF, but without a file storage or buffer upload, 
        // we'll send a well-formatted HTML email with the details.
        if (body.sendEmail && slip.user.email) {

            const totalEarnings = (slip.basicSalary + slip.hra + slip.special + slip.conveyance + slip.medical + slip.bonus);
            const totalDeductions = (slip.pf + slip.professionalTax + slip.tds + slip.loan + slip.otherDeductions);
            const netPay = totalEarnings - totalDeductions;

            const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
                <h2 style="color: #B8860B; text-align: center;">TEJASKP AI SOFTWARE</h2>
                <h3 style="text-align: center; color: #333;">Salary Slip: ${slip.month} ${slip.year}</h3>
                <hr style="border-top: 1px solid #eee;">
                
                <p>Dear <strong>${slip.user.name}</strong>,</p>
                <p>Your salary slip for the month of <strong>${slip.month} ${slip.year}</strong> has been generated.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f9f9f9;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Earnings</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: green;">₹ ${totalEarnings.toLocaleString()}</td>
                    </tr>
                     <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Deductions</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: red;">₹ ${totalDeductions.toLocaleString()}</td>
                    </tr>
                    <tr style="background: #333; color: white;">
                        <td style="padding: 10px; border: 1px solid #333;"><strong>NET PAYABLE</strong></td>
                        <td style="padding: 10px; border: 1px solid #333; text-align: right; font-weight: bold;">₹ ${netPay.toLocaleString()}</td>
                    </tr>
                </table>

                <p style="font-size: 12px; color: #666;">Bank: ${slip.bankName || 'N/A'} | A/C: ${slip.accountNumber || 'N/A'}</p>

                <p>Please find the detailed slip in your portal or contact HR for a PDF copy.</p>
                
                <br>
                <p>Best Regards,<br><strong>HR Department</strong><br>Tejaskp AI Software</p>
            </div>
            `;

            // Call internal email API (mocked or real)
            try {
                // We use fetch here to call our own API, or import logic directly.
                // Importing is safer in Next 13 server components context but fetch works for route handlers too if absolute URL.
                // Let's rely on common utility helper if exists, or just do the fetch to localhost if we knew the port.
                // Better: Just instantiate the nodemailer logic or call the helper function if it was refactored.
                // Since user didn't request significant refactor, we'll hit the email endpoint via fetch if possible, 
                // OR duplicate the simple nodemailer code for reliability inside this routine.

                // Let's reuse the logic via a helper if we can, but since we are in API route...
                // We'll trust the user has setup the email route correctly and just "Simulate" it here by just logging, 
                // OR we can try to POST to our own email endpoint.

                const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
                const host = request.headers.get('host') || 'localhost:3000';

                await fetch(`${protocol}://${host}/api/email/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: slip.user.email,
                        subject: `Salary Slip - ${slip.month} ${slip.year}`,
                        html: emailHtml
                    })
                });

            } catch (emailErr) {
                console.error("Failed to trigger email", emailErr);
                // Don't fail the whole request if email fails, just warn
            }
        }

        return NextResponse.json({ success: true, slip });

    } catch (error) {
        console.error("Error creating salary slip:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
