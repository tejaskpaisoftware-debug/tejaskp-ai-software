import { NextResponse } from "next/server";
import { adminTransporter, ADMIN_SENDER_IDENTITY } from "@/lib/admin-mailer";

export async function POST(request: Request) {
    try {
        const { email, name, month, pdfBase64 } = await request.json();

        if (!email || !pdfBase64) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const mailOptions = {
            from: ADMIN_SENDER_IDENTITY,
            to: email,
            subject: `Salary Slip for ${month} - TejasKP AI Software`,
            text: `Dear ${name},\n\nPlease find attached your Salary Slip for ${month}.\n\nBest regards,\nTejasKP AI Software`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #d4a017;">Salary Slip: ${month}</h2>
                    <p>Dear <strong>${name}</strong>,</p>
                    <p>Please find attached your official <strong>Salary Slip</strong> for the month of ${month}.</p>
                    <br/>
                    <p>Best Regards,</p>
                    <p><strong>TejasKP AI Software</strong></p>
                </div>
            `,
            attachments: [
                {
                    filename: `Salary_Slip_${name.replace(/\s+/g, "_")}_${month}.pdf`,
                    content: pdfBase64.split("base64,")[1],
                    encoding: 'base64',
                },
            ],
        };

        await adminTransporter.sendMail(mailOptions);
        return NextResponse.json({ success: true, message: "Salary Slip email sent successfully" });

    } catch (error: any) {
        console.error("Error sending salary slip email:", error);
        return NextResponse.json({ success: false, error: error?.message || "Failed to send email" }, { status: 500 });
    }
}
