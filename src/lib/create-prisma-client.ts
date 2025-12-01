import { PrismaPg } from '@prisma/adapter-pg';
import { withAccelerate } from '@prisma/extension-accelerate';
import type { Prisma } from '@/generated/prisma';
import { PrismaClient } from '@/generated/prisma';

type PrismaClientOverrides = Prisma.PrismaClientOptions;

const DEFAULT_ERROR_FORMAT: Prisma.ErrorFormat = 'pretty';
const DEFAULT_DEV_LOG_LEVELS: Prisma.LogLevel[] = ['error', 'warn'];
const CLOUD_SIGNATURE = 'prisma+postgres';

function resolveDatabaseUrl(
  overrides?: PrismaClientOverrides
): string | undefined {
  return overrides?.datasources?.db?.url ?? process.env.DATABASE_URL;
}

function resolveBaseOptions(
  overrides: PrismaClientOverrides = {}
): Prisma.PrismaClientOptions {
  const isDev = process.env.NODE_ENV === 'development';

  return {
    ...overrides,
    log: overrides.log ?? (isDev ? DEFAULT_DEV_LOG_LEVELS : ['error']),
    errorFormat: overrides.errorFormat ?? DEFAULT_ERROR_FORMAT,
  };
}

export function createPrismaClient(
  overrides: PrismaClientOverrides = {}
): PrismaClient {
  const databaseUrl = resolveDatabaseUrl(overrides);
  if (!databaseUrl)
    throw new Error('DATABASE_URL environment variable is not defined.');

  const baseOptions = resolveBaseOptions(overrides);
  const shouldUseAccelerate =
    databaseUrl.includes(CLOUD_SIGNATURE) ||
    Boolean(process.env.PRISMA_ACCELERATE_URL);

  if (shouldUseAccelerate && !baseOptions.adapter) {
    return new PrismaClient(baseOptions).$extends(withAccelerate());
  }

  if (!baseOptions.adapter) {
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    return new PrismaClient({ ...baseOptions, adapter });
  }

  return new PrismaClient(baseOptions);
}
