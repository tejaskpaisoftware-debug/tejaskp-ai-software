import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';

import fs from 'fs';
import path from 'path';

function logSync(message: string) {
    const logFile = path.join(process.cwd(), 'sync-debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
    console.log(message);
}

export async function syncTitanEmails(userId: string) {
    logSync(`🔄 Starting IMAP Sync for user: ${userId}`);

    const config = {
        imap: {
            user: process.env.SMTP_USER!,
            password: process.env.SMTP_PASS!,
            host: process.env.IMAP_HOST || 'imap.secureserver.net',
            port: parseInt(process.env.IMAP_PORT || '993'),
            tls: true,
            authTimeout: 10000,
            tlsOptions: { rejectUnauthorized: false }
        }
    };

    let connection;
    let syncedCount = 0;

    try {
        logSync(`Connecting to ${config.imap.host}...`);
        connection = await imaps.connect(config);
        logSync("Connected. Opening INBOX...");
        await connection.openBox('INBOX');

        // Fetch ALL messages, but we'll limit processing to recent ones locally or via slice if supported
        // imap-simple doesn't support complex SEARCH syntax easily for "LAST 10", so we fetch generally and slice
        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: false, // Don't mark as seen just by listing
            struct: true
        };

        logSync("Searching for messages...");
        const allMessages = await connection.search(searchCriteria, fetchOptions);
        // Process only the last 10 messages to avoid overwhelming sync
        const messages = allMessages.slice(-10);

        logSync(`📩 Found ${allMessages.length} total messages on server. Processing last ${messages.length}.`);

        // Find the target internal mailbox for the user (likely Admin)
        // In the future, we could look up by "To" address if we had multiple aliases
        const targetMailbox = await prisma.mailbox.findUnique({
            where: { userId: userId }
        });

        if (!targetMailbox) {
            logSync("❌ Target mailbox not found for existing user.");
            return 0;
        }

        for (const item of messages) {
            const all = item.parts.find((part: any) => part.which === '');
            if (!all) continue;

            const parsed = await simpleParser(all.body);

            const subject = parsed.subject || "(No Subject)";
            const fromText = parsed.from?.text || "Unknown";
            const fromAddress = parsed.from?.value?.[0]?.address || "unknown@external";
            const fromName = parsed.from?.value?.[0]?.name || fromAddress;
            const body = parsed.text || parsed.html || "(No Content)";

            logSync(`Checking msg: "${subject}" from ${fromAddress}`);

            // Check if from our own portal (prevent loops)
            if (fromAddress.includes('@portal.tejaskp.com') || fromAddress.includes('@tejaskpaiportal.com')) {
                logSync("Skipping internal sender.");
                continue;
            }

            // Prevent Duplicates: Check if we already have this email for this user
            // using a fuzzy match on subject, externalSender, and roughly createdAt
            // Ideally we'd use Message-ID but we need to store it first.
            const existing = await prisma.email.findFirst({
                where: {
                    subject: subject,
                    externalSender: fromAddress,
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
                    }
                }
            });

            if (existing) {
                logSync("⏩ Skipping duplicate.");
                continue;
            }

            logSync(`📥 Importing: ${subject}`);

            // Create Email Record
            const email = await prisma.email.create({
                data: {
                    subject: subject,
                    body: body,
                    isExternal: true,
                    externalSender: fromAddress,
                    externalName: fromName,
                    // We don't provide senderId, it's optional now
                    recipients: {
                        create: {
                            mailboxId: targetMailbox.id,
                            folder: 'INBOX',
                            isRead: false
                        }
                    }
                }
            });
            syncedCount++;
        }

    } catch (error) {
        logSync(`❌ IMAP Sync Error: ${error instanceof Error ? error.message : String(error)}`);
        // Don't throw to prevent API crash, just return count
    } finally {
        if (connection) {
            connection.end();
        }
    }
    logSync(`✅ Sync complete. Imported ${syncedCount} messages.`);
    return syncedCount;
}
