import type { Prisma } from '@/generated/prisma/client';
import { createPrismaClient } from './create-prisma-client';

export type PrismaClientInstance = ReturnType<typeof createPrismaClient>;
export type TransactionClient = Prisma.TransactionClient;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClientInstance;
};

const prisma =
  globalForPrisma.prisma ??
  createPrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
