const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting recovery...');

    // 1. Get the new Student ID
    const student = await prisma.user.findFirst({
        where: { role: 'STUDENT' }
    });

    if (!student) {
        console.error("No student found!");
        return;
    }
    console.log(`Recovering for student: ${student.name} (${student.id})`);

    // 2. Scan Uploads
    const uploadsDir = path.join(process.cwd(), 'public/uploads/submissions');

    if (!fs.existsSync(uploadsDir)) {
        console.log("No uploads directory found.");
        return;
    }

    const weeks = fs.readdirSync(uploadsDir);

    for (const week of weeks) {
        if (week.startsWith('.')) continue; // skip .DS_Store

        const weekPath = path.join(uploadsDir, week);
        const userFolders = fs.readdirSync(weekPath);

        for (const oldUserId of userFolders) {
            if (oldUserId.startsWith('.')) continue;

            // We assume all these orphaned folders belong to the Main Student
            const userPath = path.join(weekPath, oldUserId);
            const files = fs.readdirSync(userPath);

            // Group files by timestamp (doc_TIMESTAMP.pdf, data_TIMESTAMP.xlsx)
            const groups = {};

            files.forEach(file => {
                if (file.startsWith('.')) return;

                // Extract timestamp: doc_123456.pdf -> 123456
                const match = file.match(/_(.+)\./);
                if (match) {
                    const ts = match[1];
                    if (!groups[ts]) groups[ts] = {};

                    if (file.endsWith('.pdf')) groups[ts].pdf = file;
                    if (file.endsWith('.xlsx') || file.endsWith('.xls')) groups[ts].excel = file;
                }
            });

            // Insert into DB
            for (const ts in groups) {
                const pair = groups[ts];
                if (pair.pdf && pair.excel) {
                    const relPdfPath = `/uploads/submissions/${week}/${oldUserId}/${pair.pdf}`;
                    const relExcelPath = `/uploads/submissions/${week}/${oldUserId}/${pair.excel}`;

                    // Check if already exists (avoid dupes if running multiple times)
                    // Actually, since DB was reset, we just insert.

                    console.log(`Restoring submission from ${ts}...`);

                    await prisma.submission.create({
                        data: {
                            userId: student.id, // Assign to NEW ID
                            weekStartDate: week,
                            pdfPath: relPdfPath,
                            excelPath: relExcelPath,
                            status: 'SUBMITTED', // Default to SUBMITTED
                            submittedAt: new Date(parseInt(ts))
                        }
                    });
                }
            }
        }
    }
    console.log("Recovery complete!");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
