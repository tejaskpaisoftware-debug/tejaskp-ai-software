const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking for duplicates...");

    const users = await prisma.user.findMany({
        include: {
            invoices: true,
            attendance: true,
            joiningLetters: true
        }
    });

    console.log(`Total users: ${users.length}`);

    // Group by Mobile
    const mobileGroups = {};
    users.forEach(u => {
        const mobile = u.mobile ? u.mobile.trim() : 'UNKNOWN';
        if (!mobileGroups[mobile]) mobileGroups[mobile] = [];
        mobileGroups[mobile].push(u);
    });

    console.log("\n--- Duplicates by Mobile ---");
    Object.keys(mobileGroups).forEach(mobile => {
        if (mobileGroups[mobile].length > 1) {
            console.log(`Mobile: ${mobile} has ${mobileGroups[mobile].length} users`);
            mobileGroups[mobile].forEach(u => {
                console.log(`  - ID: ${u.id}, Name: ${u.name}, Created: ${u.createdAt.toISOString()}, Invoices: ${u.invoices.length}, Attendance: ${u.attendance.length}`);
            });
        }
    });

    // Group by Name (Loose check)
    const nameGroups = {};
    users.forEach(u => {
        const name = u.name ? u.name.toLowerCase().trim() : 'UNKNOWN';
        if (!nameGroups[name]) nameGroups[name] = [];
        nameGroups[name].push(u);
    });

    console.log("\n--- Potential Duplicates by Name ---");
    Object.keys(nameGroups).forEach(name => {
        if (nameGroups[name].length > 1) {
            // Only show if mobiles are different (otherwise caught above)
            const mobiles = new Set(nameGroups[name].map(u => u.mobile));
            if (mobiles.size > 1) {
                console.log(`Name: "${name}" has ${nameGroups[name].length} users with different mobiles`);
                nameGroups[name].forEach(u => {
                    console.log(`  - ID: ${u.id}, Mobile: ${u.mobile}, Created: ${u.createdAt.toISOString()}, Invoices: ${u.invoices.length}`);
                });
            }
        }
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
