
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking users with salary slips...");
    const users = await prisma.user.findMany({
        where: {
            role: 'EMPLOYEE'
        },
        include: {
            salarySlips: true
        }
    });

    console.log(`Found ${users.length} employees.`);
    users.forEach(u => {
        console.log(`User: ${u.name} (${u.id})`);
        console.log(`Salary Slips: ${u.salarySlips ? u.salarySlips.length : 'undefined'}`);
        if (u.salarySlips && u.salarySlips.length > 0) {
            u.salarySlips.forEach(s => {
                console.log(` - ${s.month} ${s.year} (ID: ${s.id})`);
            });
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
