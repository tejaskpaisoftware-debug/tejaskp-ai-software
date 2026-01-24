const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({
    select: { createdAt: true, paidAmount: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log("Recent Invoices:", invoices);
  
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const count2026 = await prisma.invoice.count({
    where: { createdAt: { gte: startOfYear } }
  });
  console.log(`Invoices in ${currentYear}:`, count2026);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
