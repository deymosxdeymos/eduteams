import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const actualApiI18n = await import("@/lib/api-i18n");
const actualAuth = await import("@/lib/auth");
const actualNextHeaders = await import("next/headers");
const actualPrisma = await import("@/lib/prisma");
const actualRateLimit = await import("@/lib/rate-limit");
const actualSyncAccount = await import("@/lib/demo/sync-account");

let mockedLocale: "id" | "en" = "id";

const signInEmailMock = mock(async () => undefined);
const signUpEmailMock = mock(async () => ({ user: { id: "demo-user" } }));
const nextHeadersMock = mock(async () => new Headers());
const checkRateLimitMock = mock(async () => ({
  allowed: true,
  retryAfterSeconds: 60,
}));
const getClientIdentifierMock = mock(() => "198.51.100.9");
const bootstrapDemoStudentAccountMock = mock(async () => ({
  demoTeacherId: null,
}));

const prismaMock = {
  user: {
    findUnique: mock(async () => null),
  },
};

function applyModuleMocks() {
  mock.module("@/lib/api-i18n", () => ({
    ...actualApiI18n,
    getRequestLocale: () => mockedLocale,
  }));

  mock.module("@/lib/auth", () => ({
    auth: {
      api: {
        signInEmail: signInEmailMock,
        signUpEmail: signUpEmailMock,
      },
    },
  }));

  mock.module("next/headers", () => ({
    ...actualNextHeaders,
    headers: nextHeadersMock,
  }));

  mock.module("@/lib/prisma", () => ({
    default: prismaMock,
  }));

  mock.module("@/lib/rate-limit", () => ({
    checkRateLimit: checkRateLimitMock,
    getClientIdentifier: getClientIdentifierMock,
  }));

  mock.module("@/lib/demo/sync-account", () => ({
    ...actualSyncAccount,
    bootstrapDemoStudentAccount: bootstrapDemoStudentAccountMock,
  }));
}

function restoreModuleMocks() {
  mock.module("@/lib/api-i18n", () => actualApiI18n);
  mock.module("@/lib/auth", () => ({ ...actualAuth }));
  mock.module("next/headers", () => actualNextHeaders);
  mock.module("@/lib/prisma", () => ({ default: actualPrisma.default }));
  mock.module("@/lib/rate-limit", () => actualRateLimit);
  mock.module("@/lib/demo/sync-account", () => actualSyncAccount);
}

function createRequest(role: "TEACHER" | "STUDENT" = "TEACHER") {
  return {
    text: async () => JSON.stringify({ role }),
    headers: new Headers({
      "content-type": "application/json",
      origin: "http://localhost:3000",
      referer: "http://localhost:3000/examples/auth",
    }),
    cookies: {
      get: () => undefined,
    },
  } as any;
}

describe("POST /api/demo/login localized redirect", () => {
  const originalDemoMode = process.env.DEMO_MODE;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    mockedLocale = "id";
    process.env.DEMO_MODE = "1";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    signInEmailMock.mockReset();
    signUpEmailMock.mockReset();
    nextHeadersMock.mockReset();
    checkRateLimitMock.mockReset();
    getClientIdentifierMock.mockReset();
    bootstrapDemoStudentAccountMock.mockReset();
    prismaMock.user.findUnique.mockReset();

    signInEmailMock.mockResolvedValue(undefined);
    signUpEmailMock.mockResolvedValue({ user: { id: "demo-user" } });
    nextHeadersMock.mockResolvedValue(new Headers());
    checkRateLimitMock.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 60,
    });
    getClientIdentifierMock.mockReturnValue("198.51.100.9");
    bootstrapDemoStudentAccountMock.mockResolvedValue({ demoTeacherId: null });
    prismaMock.user.findUnique.mockResolvedValue(null);

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }

    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
      return;
    }

    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it("preserves the english locale in the redirect payload", async () => {
    mockedLocale = "en";

    const { POST } = await import("../route");
    const response = await POST(createRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      success: true,
      data: {
        redirectTo: "/en/onboarding/role",
      },
    });
  });

  it("keeps the default locale redirect without a prefix", async () => {
    const { POST } = await import("../route");
    const response = await POST(createRequest("STUDENT"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      success: true,
      data: {
        redirectTo: "/onboarding/role",
      },
    });
    expect(bootstrapDemoStudentAccountMock).toHaveBeenCalledWith("demo-user", expect.any(String), {
      revalidate: false,
    });
  });
});
