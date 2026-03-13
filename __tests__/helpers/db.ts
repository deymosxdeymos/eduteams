import type { PrismaClientInstance } from "@/lib/prisma";
import { createPrismaClient } from "@/lib/create-prisma-client";

const prisma: PrismaClientInstance = createPrismaClient();

export async function resetDatabase(): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT format('%I.%I', schemaname, tablename) as table_name
    FROM pg_tables
    WHERE schemaname = current_schema()
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) return;

  const tableNames = tables.map((t: { table_name: string }) => t.table_name).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE`);
}

export async function recreateSchema(): Promise<void> {
  const schema = globalThis.__TEST_SCHEMA__;
  if (!schema) throw new Error("Test schema not found");

  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);

  const { $ } = await import("bun");
  await $`bunx prisma migrate deploy`
    .env({ ...process.env, DATABASE_URL: process.env.DATABASE_URL! })
    .quiet();
}
