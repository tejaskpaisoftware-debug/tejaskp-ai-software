const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const projects = [
        {
            title: "E-Commerce Website",
            description: "Full-stack e-commerce solution for a retail client. Needs React/Next.js frontend and Node.js backend.",
            category: "Website Development",
            commissionRate: 5.0
        },
        {
            title: "Clinic Management App",
            description: "Mobile application for booking appointments and managing patient records.",
            category: "Mobile Application",
            commissionRate: 5.0
        },
        {
            title: "Corporate Branding",
            description: "Logo design, banners, and visiting cards for a new startup.",
            category: "Graphic Design",
            commissionRate: 5.0
        },
        {
            title: "AI Chatbot Integration",
            description: "Integrate a custom LLM chatbot into an existing customer support portal.",
            category: "AI / ML Solutions",
            commissionRate: 5.0
        }
    ];

    console.log("Seeding projects...");

    for (const p of projects) {
        await prisma.project.create({
            data: {
                ...p,
                status: 'OPEN'
            }
        });
    }

    console.log("Projects seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
