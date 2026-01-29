import { NextResponse } from "next/server";
import { adminTransporter, ADMIN_SENDER_IDENTITY } from "@/lib/admin-mailer";

export async function POST(request: Request) {
    try {
        const { email, name, certificateType, pdfBase64 } = await request.json();

        if (!email || !pdfBase64) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const mailOptions = {
            from: ADMIN_SENDER_IDENTITY,
            to: email,
            subject: `Experience Certificate - TejasKP AI Software`,
            text: `Dear ${name},\n\nPlease find attached your Experience Certificate.\n\nBest regards,\nTejasKP AI Software`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                     <p>Dear <strong>${name}</strong>,</p>
                     
                     <p>Congratulations on successfully completing your internship program at <strong>TEJASKP AI SOFTWARE</strong>.</p>
                     
                     <p>Please find attached your official internship completion certificate.</p>
                     </div>

                     <p>We appreciate your dedication and contribution during your time with us. We hope this experience has been valuable for your professional growth.</p>

                     <p>We wish you all the very best for your future endeavors.</p>

                     <br/>
                     <p>Warm regards,</p>
                     
                     <p><strong>Tejas Patel</strong><br/>
                     Director</p>
                     
                     <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                     <p style="font-size: 13px; color: #555;">
                        <strong>TEJASKP AI SOFTWARE</strong><br/>
                        📞 Contact: 9104630598<br/>
                        🌐 Website: <a href="https://tejaskpaisoftware.com" style="color: #b8860b; text-decoration: none;">www.tejaskpaisoftware.com</a>
                     </p>
                </div>
            `,
            attachments: [
                {
                    filename: `${name.replace(/\s+/g, '_')}_Certificate.pdf`,
                    content: pdfBase64.split("base64,")[1],
                    encoding: 'base64',
                },
            ],
        };

        await adminTransporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: "Certificate sent successfully" });

    } catch (error: any) {
        console.error("Error sending email:", error);
        return NextResponse.json({ success: false, error: error?.message || "Failed to send email" }, { status: 500 });
    }
}
