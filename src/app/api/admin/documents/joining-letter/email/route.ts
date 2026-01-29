import { NextResponse } from "next/server";
import { adminTransporter, ADMIN_SENDER_IDENTITY } from "@/lib/admin-mailer";

export async function POST(request: Request) {
    try {
        const { email, name, pdfBase64, university, designation } = await request.json();

        if (!email || !pdfBase64) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const mailOptions = {
            from: ADMIN_SENDER_IDENTITY,
            to: email,
            subject: `Official Joining Letter - TejasKP AI Software`,
            text: `Dear ${name}, \n\nChanges have been made to your Joining Letter.Please see the attached document.\n\nWelcome to the team!\n\nBest regards, \nTejasKP AI Software`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <p>Dear <strong>${name}</strong>,</p>
                    
                    <p>We are pleased to inform you that you have been selected for the Internship Program at <strong>TEJASKP AI SOFTWARE</strong>.</p>
                    
                    <p>This email serves as your official joining confirmation.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #00bcd4; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1a1a1a;">Intern Details:</h3>
                        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                        <p style="margin: 5px 0;"><strong>University:</strong> ${university || 'N/A'}</p>
                        <p style="margin: 5px 0;"><strong>Internship Role:</strong> ${designation || 'Intern'}</p>
                        <p style="margin: 5px 0;"><strong>Organization:</strong> TEJASKP AI SOFTWARE</p>
                    </div>

                    <p>Your internship will provide you with practical exposure to live projects, industry tools, and professional working practices. You are expected to maintain discipline, follow company policies, and complete assigned tasks sincerely during the internship period.</p>

                    <h4 style="margin-bottom: 5px;">Joining Instructions:</h4>
                    <ul style="margin-top: 0;">
                        <li>Please report on your joining date as discussed.</li>
                        <li>Carry a copy of this email for reference.</li>
                        <li>Maintain professional conduct throughout the internship.</li>
                    </ul>

                    <p>We believe this internship will be a valuable learning experience and help you enhance your technical and professional skills.</p>

                    <p>We wish you all the best and look forward to working with you.</p>

                    <br/>
                    <p>Warm regards,</p>
                    
                    <p><strong>Tejas Patel</strong><br/>
                    Director</p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 13px; color: #555;">
                        <strong>TEJASKP AI SOFTWARE</strong><br/>
                        📞 Contact: 9104630598<br/>
                        🌐 Website: <a href="https://tejaskpaisoftware.com" style="color: #00bcd4; text-decoration: none;">www.tejaskpaisoftware.com</a>
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: `${name.replace(/\s+/g, '_')} _Joining_Letter.pdf`,
                    content: pdfBase64.split("base64,")[1],
                    encoding: 'base64',
                },
            ],
        };

        await adminTransporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: "Email sent successfully" });

    } catch (error: any) {
        console.error("Error sending email:", error);
        return NextResponse.json({ success: false, error: error?.message || "Failed to send email" }, { status: 500 });
    }
}
