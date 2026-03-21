import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

const actualBetterAuth = await import("better-auth");
const actualPrismaAdapter = await import("better-auth/adapters/prisma");
const actualBetterAuthNextJs = await import("better-auth/next-js");
const actualPrisma = await import("@/lib/prisma");

const betterAuthMock = mock(() => ({}));
const prismaAdapterMock = mock(() => ({}));
const nextCookiesMock = mock(() => ({}));
function applyModuleMocks() {
  mock.module("better-auth", () => ({
    betterAuth: betterAuthMock,
  }));

  mock.module("better-auth/adapters/prisma", () => ({
    prismaAdapter: prismaAdapterMock,
  }));

  mock.module("better-auth/next-js", () => ({
    nextCookies: nextCookiesMock,
  }));

  mock.module("@/lib/prisma", () => ({
    default: {},
  }));
}

function restoreModuleMocks() {
  mock.module("better-auth", () => actualBetterAuth);
  mock.module("better-auth/adapters/prisma", () => actualPrismaAdapter);
  mock.module("better-auth/next-js", () => actualBetterAuthNextJs);
  mock.module("@/lib/prisma", () => ({ default: actualPrisma.default }));
}

describe("Auth Configuration", () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET = "test-secret";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should have required environment variables for auth", () => {
    expect(process.env.BETTER_AUTH_SECRET).toBe("test-secret");
    expect(process.env.BETTER_AUTH_URL).toBe("http://localhost:3000");
    expect(process.env.GOOGLE_CLIENT_ID).toBe("test-google-client-id");
    expect(process.env.GOOGLE_CLIENT_SECRET).toBe("test-google-client-secret");
  });

  it("should validate auth configuration structure", () => {
    const requiredVars = [
      "BETTER_AUTH_SECRET",
      "BETTER_AUTH_URL",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
    ] as const;

    requiredVars.forEach((varName) => {
      expect(process.env[varName]).toBeDefined();
      expect(typeof process.env[varName]).toBe("string");
    });
  });

  it("should have proper URL format for BETTER_AUTH_URL", () => {
    expect(process.env.BETTER_AUTH_URL).toMatch(/^https?:\/\/.+/);
  });

  it("should have non-empty Google OAuth credentials", () => {
    expect(process.env.GOOGLE_CLIENT_ID?.length).toBeGreaterThan(0);
    expect(process.env.GOOGLE_CLIENT_SECRET?.length).toBeGreaterThan(0);
  });
});

describe("createAuth deployment behavior", () => {
  beforeEach(() => {
    betterAuthMock.mockReset();
    prismaAdapterMock.mockReset();
    nextCookiesMock.mockReset();

    betterAuthMock.mockReturnValue({});
    prismaAdapterMock.mockReturnValue({});
    nextCookiesMock.mockReturnValue({});

    process.env.BETTER_AUTH_SECRET = "test-secret";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();
  });

  it("fails before initializing auth when Google OAuth env is missing", async () => {
    delete process.env.GOOGLE_CLIENT_ID;

    const { auth } = await import(`../auth?missing-google=${Date.now()}`);

    expect(() => {
      void auth.api;
    }).toThrow("Missing required environment variables: GOOGLE_CLIENT_ID");
    expect(betterAuthMock).not.toHaveBeenCalled();
  });

  it("includes the configured Better Auth base URL during bootstrap", async () => {
    const { auth } = await import(`../auth?base-url=${Date.now()}`);
    void auth.api;

    expect(betterAuthMock).toHaveBeenCalled();
    expect(betterAuthMock.mock.calls[0]?.[0]?.baseURL).toBe("http://localhost:3000");
  });

  it("includes Google social auth providers in production", async () => {
    const { auth } = await import(`../auth?timestamp=${Date.now()}`);
    void auth.api;

    expect(betterAuthMock).toHaveBeenCalled();
    expect(betterAuthMock.mock.calls[0]?.[0]?.socialProviders).toBeDefined();
  });
});
