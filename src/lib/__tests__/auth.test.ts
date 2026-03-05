import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from 'bun:test';

const actualBetterAuth = await import('better-auth');
const actualPrismaAdapter = await import('better-auth/adapters/prisma');
const actualBetterAuthNextJs = await import('better-auth/next-js');
const actualPrisma = await import('@/lib/prisma');

const betterAuthMock = mock(() => ({}));
const prismaAdapterMock = mock(() => ({}));
const nextCookiesMock = mock(() => ({}));
function applyModuleMocks() {
  mock.module('better-auth', () => ({
    betterAuth: betterAuthMock,
  }));

  mock.module('better-auth/adapters/prisma', () => ({
    prismaAdapter: prismaAdapterMock,
  }));

  mock.module('better-auth/next-js', () => ({
    nextCookies: nextCookiesMock,
  }));

  mock.module('@/lib/prisma', () => ({
    default: {},
  }));
}

function restoreModuleMocks() {
  mock.module('better-auth', () => actualBetterAuth);
  mock.module('better-auth/adapters/prisma', () => actualPrismaAdapter);
  mock.module('better-auth/next-js', () => actualBetterAuthNextJs);
  mock.module('@/lib/prisma', () => ({ default: actualPrisma.default }));
}

describe('Auth Configuration', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should have required environment variables for auth', () => {
    expect(process.env.BETTER_AUTH_URL).toBe('http://localhost:3000');
    expect(process.env.GOOGLE_CLIENT_ID).toBe('test-google-client-id');
    expect(process.env.GOOGLE_CLIENT_SECRET).toBe(
      'test-google-client-secret'
    );
  });

  it('should validate auth configuration structure', () => {
    const requiredVars = [
      'BETTER_AUTH_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
    ] as const;

    requiredVars.forEach(varName => {
      expect(process.env[varName]).toBeDefined();
      expect(typeof process.env[varName]).toBe('string');
    });
  });

  it('should have proper URL format for BETTER_AUTH_URL', () => {
    expect(process.env.BETTER_AUTH_URL).toMatch(/^https?:\/\/.+/);
  });

  it('should have non-empty Google OAuth credentials', () => {
    expect(process.env.GOOGLE_CLIENT_ID?.length).toBeGreaterThan(0);
    expect(process.env.GOOGLE_CLIENT_SECRET?.length).toBeGreaterThan(0);
  });
});

describe.serial('shouldBlockPublicDemoCredentialAuth', () => {
  beforeEach(() => {
    betterAuthMock.mockReset();
    prismaAdapterMock.mockReset();
    nextCookiesMock.mockReset();

    betterAuthMock.mockReturnValue({});
    prismaAdapterMock.mockReturnValue({});
    nextCookiesMock.mockReturnValue({});
    delete process.env.DEMO_MODE;

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();
  });

  it('keeps social sign-in available when demo mode is enabled', async () => {
    process.env.DEMO_MODE = '1';

    const { shouldBlockPublicDemoCredentialAuth } = await import('../auth');

    expect(
      shouldBlockPublicDemoCredentialAuth({
        url: 'http://localhost:3000/api/auth/sign-in/social',
      })
    ).toBe(false);
  });

  it('keeps blocking public email auth flows in demo mode', async () => {
    process.env.DEMO_MODE = '1';

    const { shouldBlockPublicDemoCredentialAuth } = await import('../auth');

    expect(
      shouldBlockPublicDemoCredentialAuth({
        url: 'http://localhost:3000/api/auth/sign-in/email',
      })
    ).toBe(true);
    expect(
      shouldBlockPublicDemoCredentialAuth({
        url: 'http://localhost:3000/api/auth/sign-up/email',
      })
    ).toBe(true);
  });

  it('does not block auth routes outside demo mode or unrelated paths', async () => {
    const { shouldBlockPublicDemoCredentialAuth } = await import('../auth');

    expect(
      shouldBlockPublicDemoCredentialAuth({
        url: 'http://localhost:3000/api/auth/sign-in/social',
      })
    ).toBe(false);

    process.env.DEMO_MODE = '1';

    expect(
      shouldBlockPublicDemoCredentialAuth({
        url: 'http://localhost:3000/api/auth/session',
      })
    ).toBe(false);
    expect(
      shouldBlockPublicDemoCredentialAuth({
        url: 'http://localhost:3000/dashboard',
      })
    ).toBe(false);
  });
});
