import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
    try {
        const { email, name, month, year, pdfBase64 } = await request.json();

        if (!email || !pdfBase64) {
            return NextResponse.json({ success: false, error: "Missing email or PDF data" }, { status: 400 });
        }

        // Authentication (Using Gmail App Password)
        const USER = "tejaskpaisoftware@gmail.com";
        const PASS = "jskr uhvo wxbr pahe";

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: USER,
                pass: PASS,
            },
        });

        const mailOptions = {
            from: `"TejasKP AI Software" <${USER}>`,
            to: email,
            subject: `Salary Slip - ${month} ${year} - TejasKP AI Software`,
            text: `Dear ${name},\n\nPlease find attached your Salary Slip for ${month} ${year}.\n\nIf you have any queries regarding this slip, please contact HR.\n\nBest regards,\nTejasKP AI Software\nVododara, Gujarat\n\n📞 Contact: 9104630598`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <p>Dear <strong>${name}</strong>,</p>
                    
                    <p>Please find attached your Salary Slip for <strong>${month} ${year}</strong>.</p>
                    
                    <p>If you have any queries regarding this slip, please contact HR.</p>
                    
                    <br/>
                    <p>Best regards,</p>
                    <p><strong>TejasKP AI Software</strong><br>
                    Vadodara, Gujarat</p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                     <p style="font-size: 13px; color: #555;">
                        Confidential: This message contains confidential information intended only for the individual named. 
                        If you are not the named addressee you should not disseminate, distribute or copy this e-mail.
                     </p>
                </div>
            `,
            attachments: [
                {
                    filename: `SalarySlip_${month}_${year}.pdf`,
                    content: pdfBase64.split("base64,")[1],
                    encoding: 'base64',
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        return NextResponse.json({ success: true, message: "Salary Slip email sent successfully" });

    } catch (error: any) {
        console.error("Error sending salary slip email:", error);
        return NextResponse.json({ success: false, error: error?.message || "Failed to send email" }, { status: 500 });
    }
}
