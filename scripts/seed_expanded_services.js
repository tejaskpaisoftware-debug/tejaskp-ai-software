const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const projects = [
        // Requested Services
        {
            title: "Digital Marketing Campaign",
            description: "Comprehensive SEO, Social Media Marketing (SMM), and Google Ads management for business growth.",
            category: "Digital Marketing",
            commissionRate: 5.0
        },
        {
            title: "Static Business Website",
            description: "Fast, responsive, and SEO-friendly static website for small businesses and portfolios.",
            category: "Website Development",
            commissionRate: 5.0
        },
        {
            title: "Custom Software Solution",
            description: "Tailored software development (CRM, ERP, Inventory Management) to streamline business operations.",
            category: "Custom Software",
            commissionRate: 5.0
        },
        {
            title: "Mobile App Development",
            description: "Native or Cross-platform (Flutter/React Native) mobile application development for Android and iOS.",
            category: "Mobile Application",
            commissionRate: 5.0
        },

        // IT Sector Domains (as Projects/Services)
        {
            title: "Web Development Services",
            description: "Full-stack web application development using modern technologies like MERN and Next.js.",
            category: "Web Development",
            commissionRate: 7.0
        },
        {
            title: "Data Analytics & Insights",
            description: "Data visualization, reporting, and business intelligence solutions for informed decision making.",
            category: "Data Analyst",
            commissionRate: 5.0
        },
        {
            title: "Cyber Security Audit",
            description: "Vulnerability assessment, penetration testing, and security auditing for web and network infrastructure.",
            category: "Cyber Security",
            commissionRate: 5.0
        },
        {
            title: "Cloud Infrastructure Setup",
            description: "AWS/Azure/GCP cloud serve setup, migration, and DevOps automation services.",
            category: "Cloud Computing",
            commissionRate: 5.0
        },
        {
            title: "UI/UX Design Services",
            description: "User interface and user experience design for web and mobile applications.",
            category: "Design",
            commissionRate: 10.0
        }
    ];

    console.log("Seeding expanded projects...");

    for (const p of projects) {
        // Check if exists to avoid duplicates (optional but good)
        const exists = await prisma.project.findFirst({
            where: { title: p.title }
        });

        if (!exists) {
            await prisma.project.create({
                data: {
                    ...p,
                    status: 'OPEN'
                }
            });
            console.log(`Created: ${p.title}`);
        } else {
            console.log(`Skipped (Exists): ${p.title}`);
        }
    }

    console.log("Projects expansion complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
