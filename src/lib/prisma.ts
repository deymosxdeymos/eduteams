import { PrismaClient } from '@/generated/prisma';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// Use accelerate only for cloud database (when DATABASE_URL contains 'prisma+postgres')
const isCloudDatabase = process.env.DATABASE_URL?.includes('prisma+postgres');

const prisma =
  globalForPrisma.prisma ||
  (isCloudDatabase
    ? new PrismaClient().$extends(withAccelerate())
    : new PrismaClient());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
