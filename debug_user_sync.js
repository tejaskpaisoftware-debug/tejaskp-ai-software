
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- DEBUGGING USER DATA ---");

    const mobile = "8155832373";
    const name = "Bhakti Gandhi";

    // 1. Find Users by Mobile
    const usersByMobile = await prisma.user.findMany({
        where: { mobile: mobile }
    });
    console.log(`Found ${usersByMobile.length} users with mobile ${mobile}:`);
    usersByMobile.forEach(u => console.log(` - ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Created: ${u.createdAt}`));

    // 2. Find Users by Name (fuzzy)
    const usersByName = await prisma.user.findMany({
        where: { name: { contains: name, mode: 'insensitive' } }
    });
    console.log(`\nFound ${usersByName.length} users with name '${name}':`);
    usersByName.forEach(u => console.log(` - ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Mobile: ${u.mobile}`));

    // 3. Check Assessments for these users
    console.log("\n--- CHECKING ASSESSMENTS ---");
    const userIds = [...new Set([...usersByMobile, ...usersByName].map(u => u.id))];

    for (const userId of userIds) {
        const docs = await prisma.studentDocument.findMany({
            where: { userId: userId, type: "ASSESSMENT" }
        });
        console.log(`User ${userId} has ${docs.length} ASSESSMENTS.`);
        docs.forEach(d => console.log(`  - Doc: ${d.fileName}, Status: ${d.status}`));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
