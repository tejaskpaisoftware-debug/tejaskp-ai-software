import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendExternalEmail } from "@/lib/mail-relay";

export async function GET(request: Request) {
    // ... existing GET implementation ...
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const folder = searchParams.get("folder") || "INBOX";

        if (!userId) {
            return NextResponse.json({ success: false, error: "UserId is required" }, { status: 400 });
        }

        const mailbox = await prisma.mailbox.findUnique({
            where: { userId }
        });

        if (!mailbox) {
            return NextResponse.json({ success: false, error: "Mailbox not provisioned" }, { status: 404 });
        }

        const emails = await prisma.emailRecipient.findMany({
            where: {
                mailboxId: mailbox.id,
                folder: folder.toUpperCase()
            },
            include: {
                email: {
                    include: {
                        sender: {
                            include: {
                                user: {
                                    select: { name: true, photoUrl: true }
                                }
                            }
                        },
                        recipients: {
                            include: {
                                mailbox: {
                                    include: {
                                        user: {
                                            select: { name: true }
                                        }
                                    }
                                }
                            }
                        },
                        attachments: true
                    }
                }
            },
            orderBy: {
                email: {
                    createdAt: 'desc'
                }
            }
        });

        return NextResponse.json({ success: true, emails, mailbox });
    } catch (error) {
        console.error("Fetch user mailbox error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { senderUserId, toEmails, subject, content, isDraft } = body;

        if (!senderUserId || !toEmails || !subject) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const senderMailbox = await prisma.mailbox.findUnique({
            where: { userId: senderUserId },
            include: { user: { select: { name: true } } }
        });

        if (!senderMailbox) {
            return NextResponse.json({ success: false, error: "Sender mailbox not provisioned" }, { status: 404 });
        }

        const recipientAddresses = Array.isArray(toEmails) ? toEmails : toEmails.split(',').map((e: string) => e.trim());

        // Create the email record
        const email = await prisma.email.create({
            data: {
                subject,
                body: content,
                senderId: senderMailbox.id,
                isDraft: isDraft || false
            }
        });

        // Create recipient record for sender (Sent folder)
        await prisma.emailRecipient.create({
            data: {
                emailId: email.id,
                mailboxId: senderMailbox.id,
                folder: "SENT",
                isRead: true
            }
        });

        // Create recipient records for each recipient address
        const validRecipients = [];
        const externalRecipients = [];

        for (const rawAddress of recipientAddresses) {
            // Aggressive cleaning: trim, lowercase, and strip angle brackets
            const address = rawAddress.trim().toLowerCase().replace(/[<>]/g, "");
            if (!address) continue;

            // Check if internal
            const recipientMailbox = await prisma.mailbox.findFirst({
                where: { emailAddress: address }
            });

            if (recipientMailbox) {
                await prisma.emailRecipient.create({
                    data: {
                        emailId: email.id,
                        mailboxId: recipientMailbox.id,
                        folder: "INBOX",
                        isRead: false
                    }
                });
                validRecipients.push(address);
            } else {
                // External Email candidate
                if (address.includes('@') && !address.endsWith('@tejaskpaiportal.com')) {
                    const relayResult = await sendExternalEmail(
                        address,
                        subject,
                        content,
                        senderMailbox.emailAddress,
                        (senderMailbox as any).user?.name || "Portal User"
                    );
                    if (relayResult.success) {
                        externalRecipients.push(address);
                    } else {
                        console.error(`External relay failed for ${address}:`, relayResult.error);
                        // Store the error to return to the user if all fail
                        (request as any).lastRelayError = relayResult.error;
                    }
                }
            }
        }

        const totalReached = validRecipients.length + externalRecipients.length;

        if (totalReached === 0 && !isDraft) {
            // Check if we have a specific relay error to show
            const relayError = (request as any).lastRelayError;
            let errorMessage = "No valid internal or external recipients found. Check the addresses and try again.";

            if (relayError) {
                const errorStr = JSON.stringify(relayError);
                if (errorStr.includes("authentication failed") || errorStr.includes("EAUTH")) {
                    errorMessage = "External Delivery Failed: SMTP Authentication Error. Please verify the mail server password in settings.";
                } else {
                    errorMessage = `External Delivery Failed: ${relayError.response || "Server Error"}`;
                }
            }

            return NextResponse.json({
                success: false,
                error: errorMessage
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            email,
            recipientsCount: validRecipients.length,
            externalRecipientsCount: externalRecipients.length,
            invalidCount: recipientAddresses.length - totalReached
        });

    } catch (error) {
        console.error("Send email error:", error);
        return NextResponse.json({ success: false, error: `Internal Server Error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
    }
}
