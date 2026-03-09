import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { createPrismaClient } from './create-prisma-client';

export type PrismaClientInstance = ReturnType<typeof createPrismaClient>;
export type TransactionClient = Prisma.TransactionClient;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClientInstance;
};

function getPrismaClient(): PrismaClientInstance {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient({
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return globalForPrisma.prisma;
}

const prisma: PrismaClientInstance = new Proxy({} as PrismaClientInstance, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default prisma;
