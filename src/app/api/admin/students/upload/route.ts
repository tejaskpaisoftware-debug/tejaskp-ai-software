import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Helper to reliably parse string/number
const parseVal = (val: any) => {
    if (val === undefined || val === null) return "";
    return String(val).trim();
};

const parseFloatVal = (val: any) => {
    if (!val) return 0;
    // Remove Currency symbols, commas, etc
    const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
};

// Excel Date to JS Date Helper (Robust)
function safeDate(excelDate: any): string {
    if (!excelDate) return "";

    // 1. Handle "DD-MM-YYYY" string (e.g. 19-05-2025)
    if (typeof excelDate === 'string' && /^\d{1,2}-\d{1,2}-\d{4}$/.test(excelDate)) {
        const [day, month, year] = excelDate.split('-').map(Number);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            // Create as UTC or local noon to avoid timezone shifts
            const d = new Date(year, month - 1, day, 12, 0, 0);
            return d.toISOString().split('T')[0];
        }
    }

    // 2. Handle number (Excel Serial Date)
    if (typeof excelDate === 'number') {
        // Excel base date is 1899-12-30 usually
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // 3. Handle standard Date parsing
    const date = new Date(excelDate);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }

    return String(excelDate);
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to Array of Arrays to handle custom headers
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: "Excel file is empty" }, { status: 400 });
        }

        // 1. Find Header Row
        let headerRowIndex = -1;
        let colMap: Record<string, number> = {};

        // Look for "Name" and "Contact No." to identify the header
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i].map(c => String(c).trim().toLowerCase());
            if (row.includes('name') && (row.includes('contact no.') || row.includes('contact no'))) {
                headerRowIndex = i;
                // Build Column Map
                rows[i].forEach((cell: any, idx: number) => {
                    colMap[String(cell).trim().toLowerCase()] = idx;
                });
                break;
            }
        }

        if (headerRowIndex === -1) {
            return NextResponse.json({ success: false, error: "Could not find header row. Ensure 'Name' and 'Contact No.' columns exist." }, { status: 400 });
        }

        const dataRows = rows.slice(headerRowIndex + 1);
        const operations = [];

        // DB Transaction for Safety
        // We do this in a loop but we need to track mobiles created IN THIS BATCH 
        // to handle duplicates within the same file too.

        let processedMobiles = new Set<string>();

        // 2. Processing
        // We will execute sequentially to check DB for duplicates accurately or just blindly append.

        await prisma.$transaction(async (tx) => {
            for (const row of dataRows) {
                const name = parseVal(row[colMap['name']]);
                let mobile = parseVal(row[colMap['contact no.']] || row[colMap['contact no']]);

                // Validation
                // Data Extraction (Moved up for validation)
                const amount = parseFloatVal(row[colMap['amount']] || row[colMap['fees']]);

                // Cleanup Mobile - STRICT
                let cleanMobile = mobile.replace(/[^0-9]/g, '');

                // SKIP INVALID ROWS (Ghost Users Prevention)
                // RULE: Must have Name. 
                // AND (Must have Mobile OR Must have Money). 
                // If they paid money, we want them even if mobile is missing.
                if (!name || name.trim() === '') {
                    // No Name = Junk
                    continue;
                }

                // Skip rows that look like "Total", "Grand Total", etc.
                if (name.toLowerCase().includes('total')) {
                    continue;
                }

                if ((!cleanMobile || cleanMobile.length < 5) && amount === 0) {
                    // No Mobile AND No Money = Junk (Ghost)
                    console.log(`Skipping Junk Row: Name='${name}' (No Mobile, No Money)`);
                    continue;
                }

                // If no mobile but has amount, generate placeholder or FIND EXISTING
                if (!cleanMobile || cleanMobile.length < 5) {
                    // 1. Check if we already assigned a dummy mobile to this Name in THIS batch
                    // We need to iterate processedMobiles? No, processedMobiles is just a Set of strings.
                    // We can't map Name -> Mobile easily with just that Set.
                    // Let's do a DB lookup for "Name + DummyPrefix" to find strict existing matches.

                    // Look for existing user with this Name who has a generated ID
                    // Note: 'mode: insensitive' causes errors on some DBs, so we filter in JS.
                    const potentialMatches = await tx.user.findMany({
                        where: {
                            mobile: { startsWith: '99999' }
                        }
                    });

                    const existingDummy = potentialMatches.find(u =>
                        u.name?.toLowerCase().trim() === name.toLowerCase().trim()
                    );

                    if (existingDummy) {
                        cleanMobile = existingDummy.mobile;
                        console.log(`Matched Existing Dummy User: ${name} -> ${cleanMobile}`);
                    } else {
                        // Create New Dummy
                        cleanMobile = `99999${Math.floor(10000 + Math.random() * 90000)}`;
                        console.log(`Assigning NEW Dummy Mobile for ${name}: ${cleanMobile}`);
                    }
                }

                // debug logging
                // console.log(`Processing: ${name} | ${cleanMobile}`);

                // --- DUPLICATE HANDLING (SMART) ---
                const course = parseVal(row[colMap['courses']] || row[colMap['course']]);

                // Goal: 
                // 1. Same Mobile + Same Name + Same Course = IGNORE/UPDATE (Exact Duplicate Row)
                // 2. Same Mobile + Diff Course/Name = CREATE NEW (New Enrollment)

                let finalMobile = cleanMobile;
                let isUpdate = false;

                // Check if we saw this mobile in THIS batch
                if (processedMobiles.has(cleanMobile)) {
                    // We have seen this mobile. Check if it's an EXACT duplicate (Name + Course)
                    // We need to fetch what we processed? 
                    // Actually, we can just check against the DB since we are writing sequentially in the transaction.
                    // But we are in a transaction, so we should look at local state or query DB inside tx.
                    // Let's us query inside TX.

                    const existingInBatch = await tx.user.findMany({
                        where: { mobile: { startsWith: cleanMobile } }
                    });

                    const exactMatch = existingInBatch.find(u =>
                        u.name?.toLowerCase().trim() === name.toLowerCase().trim() &&
                        u.course?.toLowerCase().trim() === course.toLowerCase().trim()
                    );

                    if (exactMatch) {
                        // It's the same person, same course. Likely a duplicate row.
                        // Treat as update/noop.
                        finalMobile = exactMatch.mobile;
                        isUpdate = true;
                    } else {
                        // Different course/name. Force New.
                        finalMobile = `${cleanMobile}-${Math.floor(1000 + Math.random() * 9000)}`;
                    }

                } else {
                    // First time in batch. Check Global DB (Scanning ALL variants)
                    const existingVariants = await tx.user.findMany({
                        where: { mobile: { startsWith: cleanMobile } }
                    });

                    // Search for an EXACT Match (Name + Course) among all variants
                    const matchingVariant = existingVariants.find(u =>
                        u.name?.toLowerCase().trim() === name.toLowerCase().trim() &&
                        (u.course || '').toLowerCase().trim() === (course || '').toLowerCase().trim()
                    );

                    if (matchingVariant) {
                        // Found exact existing record (could be 123 or 123-555). Reuse it.
                        finalMobile = matchingVariant.mobile;
                        isUpdate = true;
                    } else {
                        // No exact match found.
                        // Check if the BASE mobile (cleanMobile) is strictly free
                        const baseTaken = existingVariants.some(u => u.mobile === cleanMobile);

                        if (!baseTaken) {
                            finalMobile = cleanMobile;
                        } else {
                            // Base taken (by someone else or diff course). Generate New Suffix.
                            finalMobile = `${cleanMobile}-${Math.floor(1000 + Math.random() * 9000)}`;
                        }
                    }

                    processedMobiles.add(cleanMobile);
                }





                const paid = parseFloatVal(row[colMap['paid till now']] || row[colMap['paid']]);
                const payMode = parseVal(row[colMap['payment mode']]);
                const pending = parseFloatVal(row[colMap['pending']]);
                const studyMode = parseVal(row[colMap['study mode']]);
                const duration = parseVal(row[colMap['duration']]);
                const college = parseVal(row[colMap['college']]);
                const joinDate = safeDate(row[colMap['join date']]);
                const endDate = safeDate(row[colMap['end date']]);

                // Upsert User
                const user = await tx.user.upsert({
                    where: { mobile: finalMobile },
                    update: {
                        name,
                        course,
                        totalFees: amount,
                        paidAmount: paid,
                        paymentMode: payMode,
                        pendingAmount: pending,
                        studyMode,
                        duration,
                        college,
                        joiningDate: joinDate,
                        endDate,
                    },
                    create: {
                        mobile: finalMobile,
                        name,
                        email: `student${finalMobile}@example.com`,
                        password: cleanMobile, // Use original mobile as pass
                        role: "STUDENT",
                        status: "ACTIVE",
                        course,
                        totalFees: amount,
                        paidAmount: paid,
                        paymentMode: payMode,
                        pendingAmount: pending,
                        studyMode,
                        duration,
                        college,
                        joiningDate: joinDate,
                        endDate,
                    }
                });

                // Create/Update Invoice
                if (paid > 0) {
                    const invDate = joinDate ? new Date(joinDate) : new Date();
                    await tx.invoice.upsert({
                        where: { invoiceNumber: `INV-IMP-${finalMobile}` },
                        update: {
                            paidAmount: paid,
                            total: amount,
                            subtotal: amount,
                            createdAt: invDate,
                            user: { connect: { mobile: finalMobile } }
                        },
                        create: {
                            invoiceNumber: `INV-IMP-${finalMobile}`,
                            customerName: name,
                            type: "TRAINING",
                            items: JSON.stringify([{ description: `Course Fee: ${course || 'Imported'}`, quantity: 1, rate: amount, amount: amount }]),
                            subtotal: amount,
                            discount: 0,
                            sgst: 0,
                            cgst: 0,
                            total: amount,
                            paidAmount: paid,
                            dueDate: endDate ? new Date(endDate).toISOString() : new Date().toISOString(),
                            status: paid >= amount ? "PAID" : "PARTIAL",
                            createdAt: invDate,
                            user: { connect: { mobile: finalMobile } }
                        }
                    });
                }
            }
        }, {
            maxWait: 10000,
            timeout: 20000
        });

        const finalCount = await prisma.user.count({ where: { role: 'STUDENT' } });

        return NextResponse.json({
            success: true,
            message: `Successfully processed file. Total Students: ${finalCount}`
        });

    } catch (error: any) {
        console.error("Excel Upload Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to process excel file" }, { status: 500 });
    }
}
