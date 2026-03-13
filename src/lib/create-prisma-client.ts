import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import type { Prisma } from "@/generated/prisma/client";
import { PrismaClient } from "@/generated/prisma/client";
import { assertDeploymentConfiguration } from "@/lib/deployment-config";

type PrismaClientOptions = Omit<Prisma.PrismaClientOptions, "adapter">;

interface CreatePrismaClientOptions extends PrismaClientOptions {
  url?: string;
}

const DEFAULT_ERROR_FORMAT: Prisma.ErrorFormat = "pretty";
const DEFAULT_DEV_LOG_LEVELS: Prisma.LogLevel[] = ["error", "warn"];
const CLOUD_SIGNATURE = "prisma+postgres";

// Connection pool settings to prevent exhaustion
// See: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool
const POOL_CONFIG = {
  max: 20, // Maximum connections in pool (default: 10)
  idleTimeoutMillis: 30_000, // Close idle connections after 30s (default: 10s)
  connectionTimeoutMillis: 10_000, // Fail if can't connect in 10s (default: 0 = no timeout)
};

function resolveDatabaseUrl(overrideUrl?: string): string | undefined {
  return overrideUrl ?? process.env.DATABASE_URL;
}

function resolveBaseOptions(overrides: PrismaClientOptions = {}): PrismaClientOptions {
  const isDev = process.env.NODE_ENV === "development";

  return {
    ...overrides,
    log: overrides.log ?? (isDev ? DEFAULT_DEV_LOG_LEVELS : ["error"]),
    errorFormat: overrides.errorFormat ?? DEFAULT_ERROR_FORMAT,
  };
}

export function createPrismaClient(overrides: CreatePrismaClientOptions = {}) {
  assertDeploymentConfiguration();

  const { url, ...rest } = overrides;
  const databaseUrl = resolveDatabaseUrl(url);
  if (!databaseUrl) throw new Error("DATABASE_URL environment variable is not defined.");

  const baseOptions = resolveBaseOptions(rest);
  const shouldUseAccelerate =
    databaseUrl.includes(CLOUD_SIGNATURE) || Boolean(process.env.PRISMA_ACCELERATE_URL);

  if (shouldUseAccelerate) {
    return new PrismaClient({
      ...baseOptions,
      accelerateUrl: process.env.PRISMA_ACCELERATE_URL ?? databaseUrl,
    }).$extends(withAccelerate());
  }

  const { accelerateUrl: _, ...adapterOptions } = baseOptions;

  // Pass pool config directly to PrismaPg (Prisma ORM v7 approach)
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
    ...POOL_CONFIG,
  });

  return new PrismaClient({ ...adapterOptions, adapter });
}
