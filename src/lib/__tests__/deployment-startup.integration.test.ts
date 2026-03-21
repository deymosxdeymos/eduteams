import { describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const bunExecutable = process.execPath;

function runBunEval(code: string, envOverrides: Record<string, string | undefined>) {
  const env = {
    ...process.env,
    DATABASE_URL: "postgresql://user:password@127.0.0.1:5432/eduteams_test_contract",
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost:3000",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NODE_ENV: "test",
  } as Record<string, string | undefined>;

  for (const key of [
    "VERCEL",
    "VERCEL_ENV",
    "TEAM_FORMATION_PROVIDER",
    "EDU2COM_WEBHOOK_SECRET",
    "EDU2COM_WEBHOOK_BASE_URL",
  ]) {
    delete env[key];
  }

  for (const [key, value] of Object.entries(envOverrides)) {
    if (value === undefined) {
      delete env[key];
      continue;
    }

    env[key] = value;
  }

  return spawnSync(bunExecutable, ["--eval", code], {
    cwd: repoRoot,
    env,
    encoding: "utf8",
  });
}

describe("deployment startup integration", () => {
  it("boots Prisma startup paths without Google OAuth configuration", () => {
    const result = runBunEval(
      `
        const { createPrismaClient } = await import('./src/lib/create-prisma-client.ts');
        const client = createPrismaClient();
        await client.$disconnect();
        console.log('boot-ok');
      `,
      {
        GOOGLE_CLIENT_ID: undefined,
        GOOGLE_CLIENT_SECRET: undefined,
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("boot-ok");
  });

  it("fails fast on the auth-specific config path when BETTER_AUTH_URL is missing", () => {
    const result = runBunEval(
      `
        const { assertAuthConfiguration } = await import('./src/lib/deployment-config.ts');
        assertAuthConfiguration();
      `,
      {
        BETTER_AUTH_URL: undefined,
        GOOGLE_CLIENT_ID: "prod-client",
        GOOGLE_CLIENT_SECRET: "prod-secret",
      },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Missing required environment variables: BETTER_AUTH_URL");
  });

  it("fails fast on the auth-specific config path when Google OAuth configuration is missing", () => {
    const result = runBunEval(
      `
        const { assertAuthConfiguration } = await import('./src/lib/deployment-config.ts');
        assertAuthConfiguration();
      `,
      {
        GOOGLE_CLIENT_ID: undefined,
        GOOGLE_CLIENT_SECRET: undefined,
      },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "Missing required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET",
    );
  });

  it("passes auth-specific config validation for a self-hosted production-style env", () => {
    const result = runBunEval(
      `
        const { assertAuthConfiguration } = await import('./src/lib/deployment-config.ts');
        assertAuthConfiguration();
        console.log('boot-ok');
      `,
      {
        NODE_ENV: "production",
        GOOGLE_CLIENT_ID: "prod-client",
        GOOGLE_CLIENT_SECRET: "prod-secret",
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("boot-ok");
  });
});
