import { mock } from "bun:test";

const actualApiI18n = await import("@/lib/api-i18n");
const actualNextHeaders = await import("next/headers");
const actualSyncAccount = await import("@/lib/demo/sync-account");

let mockedLocale: "id" | "en" = "en";

const signInEmailMock = mock(async () => undefined);
const signUpEmailMock = mock(async () => ({ user: { id: "demo-user" } }));
const nextHeadersMock = mock(async () => new Headers());
const checkRateLimitMock = mock(async () => ({ allowed: true, retryAfterSeconds: 60 }));
const getClientIdentifierMock = mock(() => "198.51.100.9");
const bootstrapDemoStudentAccountMock = mock(async () => ({ demoTeacherId: null }));

const prismaMock = { user: { findUnique: mock(async () => null) } };

mock.module("@/lib/api-i18n", () => ({ ...actualApiI18n, getRequestLocale: () => mockedLocale }));
mock.module("@/lib/auth", () => ({
  auth: { api: { signInEmail: signInEmailMock, signUpEmail: signUpEmailMock } },
}));
mock.module("next/headers", () => ({ ...actualNextHeaders, headers: nextHeadersMock }));
mock.module("@/lib/prisma", () => ({ default: prismaMock }));
mock.module("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
  getClientIdentifier: getClientIdentifierMock,
}));
mock.module("@/lib/demo/sync-account", () => ({
  ...actualSyncAccount,
  bootstrapDemoStudentAccount: bootstrapDemoStudentAccountMock,
}));

process.env.DEMO_MODE = "1";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET = "secret";

const { POST } = await import("@/app/api/demo/login/route");

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
  } as unknown as Parameters<typeof POST>[0];
}

const response = await POST(createRequest());
console.log("status", response.status);
console.log(await response.text());
console.log("set-cookie", response.headers.get("set-cookie"));
