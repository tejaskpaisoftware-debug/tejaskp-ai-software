const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Updating project titles to match user request...");

    // Map current titles (or close matches) to new exact titles
    const updates = [
        { old: "Digital Marketing Campaign", new: "Digital Marketing" },
        { old: "Static Business Website", new: "Static Website" },
        { old: "Custom Software Solution", new: "Custom Software" },
        { old: "Mobile App Development", new: "Mobile Application" }
    ];

    for (const update of updates) {
        const project = await prisma.project.findFirst({
            where: { title: update.old }
        });

        if (project) {
            await prisma.project.update({
                where: { id: project.id },
                data: { title: update.new }
            });
            console.log(`Renamed "${update.old}" to "${update.new}"`);
        } else {
            // Check if already renamed
            const existing = await prisma.project.findFirst({
                where: { title: update.new }
            });
            if (existing) {
                console.log(`Title "${update.new}" already exists.`);
            } else {
                console.log(`Could not find "${update.old}" to rename.`);
                // Create it if missing
                await prisma.project.create({
                    data: {
                        title: update.new,
                        description: "Professional services for " + update.new,
                        category: update.new, // Use title as category for simplicity or map appropriately
                        commissionRate: 10.0,
                        status: 'OPEN'
                    }
                });
                console.log(`Created new project: "${update.new}"`);
            }
        }
    }

    console.log("Update completed.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
