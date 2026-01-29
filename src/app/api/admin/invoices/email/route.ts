import { NextResponse } from "next/server";
import { adminTransporter, ADMIN_SENDER_IDENTITY } from "@/lib/admin-mailer";

export async function POST(request: Request) {
    try {
        const { email, name, invoiceNumber, pdfBase64 } = await request.json();

        if (!email || !pdfBase64) {
            return NextResponse.json({ success: false, error: "Missing email or PDF data" }, { status: 400 });
        }

        const mailOptions = {
            from: ADMIN_SENDER_IDENTITY,
            to: email,
            subject: `Invoice #${invoiceNumber} from TejasKP AI Software`,
            text: `Dear ${name},\n\nPlease find attached Invoice ${invoiceNumber} for your reference.\n\nWe kindly request you to process the payment at your earliest convenience.\nIf the payment has already been made, please ignore this message.\n\nShould you require any clarification, feel free to reach out.\n\nThank you for your cooperation.\n\nBest regards,\nTejasKP AI Software\nVadodara, Gujarat\n\n📞 Contact: 9104630598\n🌐 Website: www.tejaskpaisoftware.com`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <p>Dear <strong>${name}</strong>,</p>
                    
                    <p>Please find attached Invoice <strong>${invoiceNumber}</strong> for your reference.</p>
                    
                    <p>We kindly request you to process the payment at your earliest convenience.<br>
                    If the payment has already been made, please ignore this message.</p>
                    
                    <p>Should you require any clarification, feel free to reach out.</p>
                    
                    <p>Thank you for your cooperation.</p>
                    
                    <br/>
                    <p>Best regards,</p>
                    <p><strong>TejasKP AI Software</strong><br>
                    Vadodara, Gujarat</p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                     <p style="font-size: 13px; color: #555;">
                        📞 Contact: 9104630598<br/>
                        🌐 Website: <a href="https://tejaskpaisoftware.com" style="color: #00bcd4; text-decoration: none;">www.tejaskpaisoftware.com</a>
                     </p>
                </div>
            `,
            attachments: [
                {
                    filename: `Invoice_${invoiceNumber}.pdf`,
                    content: pdfBase64.split("base64,")[1],
                    encoding: 'base64',
                },
            ],
        };

        await adminTransporter.sendMail(mailOptions);
        return NextResponse.json({ success: true, message: "Invoice email sent successfully" });

    } catch (error: any) {
        console.error("Error sending invoice email:", error);
        return NextResponse.json({ success: false, error: error?.message || "Failed to send email" }, { status: 500 });
    }
}
