require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
});
const bcrypt = require('bcryptjs');

async function main() {
    console.log('Seeding database...');

    // Clean up potential conflicts
    const conflictMobiles = ['admin', '9876543210', '9104630598'];
    const conflictEmails = ['admin@tejaskpai.com', 'admin@example.com', 'student@example.com'];

    const usersToDelete = await prisma.user.findMany({
        where: {
            OR: [
                { mobile: { in: conflictMobiles } },
                { email: { in: conflictEmails } }
            ]
        },
        select: { id: true }
    });

    const userIds = usersToDelete.map(u => u.id);

    if (userIds.length > 0) {
        console.log(`Cleaning up data for ${userIds.length} users...`);
        // Use transaction or sequential deletes to handle FKs
        await prisma.mailbox.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.systemLog.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.attendance.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    // 1. Create Admin
    const adminMobile = 'admin'; // User requested login as 'admin'
    const adminPass = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { mobile: adminMobile },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@tejaskpai.com',
            mobile: adminMobile,
            password: adminPass,
            role: 'ADMIN',
            status: 'ACTIVE',
            isChatEnabled: true
        },
    });
    console.log({ admin });

    // 2. Create Student
    const studentMobile = '9104630598'; // The number user likely tried
    const studentPass = await bcrypt.hash('123456', 10);

    const student = await prisma.user.upsert({
        where: { mobile: studentMobile },
        update: {},
        create: {
            name: 'Dhara Parmar',
            email: 'student@example.com',
            mobile: studentMobile,
            password: studentPass,
            role: 'STUDENT',
            status: 'ACTIVE',
            course: 'Full Stack Development',
            joiningDate: '2024-01-01',
            isChatEnabled: true
        },
    });
    console.log({ student });
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
