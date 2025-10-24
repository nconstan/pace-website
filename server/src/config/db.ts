import pkg from '@prisma/client';
const { PrismaClient } = pkg;


const globalForPrisma = globalThis as unknown as {
  prisma: typeof PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;