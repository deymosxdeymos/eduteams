import { describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const bunExecutable = process.execPath;

function runBunEval(
  code: string,
  envOverrides: Record<string, string | undefined>
) {
  return spawnSync(bunExecutable, ['--eval', code], {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL:
        'postgresql://user:password@127.0.0.1:5432/eduteams_test_contract',
      BETTER_AUTH_SECRET: 'test-secret',
      BETTER_AUTH_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      ...envOverrides,
    },
    encoding: 'utf8',
  });
}

describe('deployment startup integration', () => {
  it('fails fast when Vercel is not configured for demo mode', () => {
    const result = runBunEval(
      `
        const { createPrismaClient } = await import('./src/lib/create-prisma-client.ts');
        createPrismaClient();
      `,
      {
        VERCEL: '1',
        DEMO_MODE: '0',
        GOOGLE_CLIENT_ID: undefined,
        GOOGLE_CLIENT_SECRET: undefined,
      }
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Vercel deployments must run with DEMO_MODE=1'
    );
  });

  it('fails fast when demo mode is combined with Google OAuth secrets', () => {
    const result = runBunEval(
      `
        const { createPrismaClient } = await import('./src/lib/create-prisma-client.ts');
        createPrismaClient();
      `,
      {
        DEMO_MODE: '1',
        GOOGLE_CLIENT_ID: 'demo-client',
        GOOGLE_CLIENT_SECRET: 'demo-secret',
        VERCEL: undefined,
        VERCEL_ENV: undefined,
      }
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Demo mode must not configure GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.'
    );
  });

  it('boots auth successfully for a self-hosted production-style env', () => {
    const result = runBunEval(
      `
        const { createPrismaClient } = await import('./src/lib/create-prisma-client.ts');
        const client = createPrismaClient();
        await client.$disconnect();
        console.log('boot-ok');
      `,
      {
        DEMO_MODE: '0',
        GOOGLE_CLIENT_ID: 'prod-client',
        GOOGLE_CLIENT_SECRET: 'prod-secret',
        VERCEL: undefined,
        VERCEL_ENV: undefined,
      }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('boot-ok');
  });
});
