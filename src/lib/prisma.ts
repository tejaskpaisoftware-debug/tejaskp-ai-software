import { PrismaClient } from '@prisma/client';

// @ts-nocheck
// Force reload: Voice Auth Schema Updateed
// Forced reload comment - update 2

const globalForPrisma = global as unknown as { prismaDb_racing_v2: PrismaClient }

// Fallback if env var is missing (e.g. running locally without .env setup)
const dbUrl = process.env.DATABASE_URL?.trim();

export const prisma =
    globalForPrisma.prismaDb_racing_v2 ||
    new PrismaClient({
        datasources: dbUrl
            ? { db: { url: dbUrl } }
            : undefined,
        log: ['error', 'warn'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaDb_racing_v2 = prisma

