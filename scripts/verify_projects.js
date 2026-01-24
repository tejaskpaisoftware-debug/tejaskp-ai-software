const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany();
    console.log("Current Projects in DB:", projects.length);
    projects.forEach(p => console.log(`- ${p.title} (${p.category})`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
