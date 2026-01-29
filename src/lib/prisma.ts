import { PrismaClient } from '@prisma/client';

// Forced reload comment - update 2

const globalForPrisma = global as unknown as { prismaDb_racing_v2: PrismaClient }

// Fallback if env var is missing (e.g. running locally without .env setup)
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
}

export const prisma =
    globalForPrisma.prismaDb_racing_v2 ||
    new PrismaClient({
        log: ['query'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaDb_racing_v2 = prisma
