import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getDemoAccount } from "@/lib/demo/auth";
import { createApiUtilsModule } from "@/test-utils/api-utils-module";

const actualAuth = await import("@/lib/auth");
const actualCsrf = await import("@/lib/csrf");
const actualNextCache = await import("next/cache");
const actualNextHeaders = await import("next/headers");
const actualPrisma = await import("@/lib/prisma");
const actualRateLimit = await import("@/lib/rate-limit");

const originalDevAllowedOrigins = process.env.DEV_ALLOWED_ORIGINS;

process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.DEMO_MODE = "1";

const getCurrentUserMock = mock(async () => null);
const signInEmailMock = mock(async () => undefined);
const signUpEmailMock = mock(async () => ({ user: { id: "created-user" } }));
const cookieStoreDeleteMock = mock(() => undefined);
const nextCookiesMock = mock(async () => ({
  delete: cookieStoreDeleteMock,
}));
const nextHeadersMock = mock(async () => new Headers());
const revalidateTagMock = mock(() => {});
const isSameOriginMock = mock((request: { headers: Headers }) =>
  Boolean(request.headers.get("origin") || request.headers.get("referer")),
);
const checkRateLimitMock = mock(() => ({
  allowed: true,
  retryAfterSeconds: 60,
}));
const getClientIdentifierMock = mock(() => null);

const prismaMock = {
  user: {
    findUnique: mock(async () => null),
    update: mock(async () => ({})),
    delete: mock(async () => ({})),
  },
  account: {
    create: mock(async () => ({})),
    update: mock(async () => ({})),
  },
  personalityProfile: {
    upsert: mock(async () => ({})),
  },
  course: {
    findMany: mock(async () => []),
  },
  courseEnrollment: {
    createMany: mock(async () => ({ count: 0 })),
  },
  $transaction: mock(async (input: unknown) => {
    if (typeof input === "function") {
      return input(prismaMock as any);
    }

    return [];
  }),
};

function applyModuleMocks() {
  mock.module("next/headers", () => ({
    cookies: nextCookiesMock,
    headers: nextHeadersMock,
  }));

  mock.module("next/cache", () => ({
    ...actualNextCache,
    revalidateTag: revalidateTagMock,
  }));

  mock.module("@/lib/api-utils", () =>
    createApiUtilsModule({
      getCurrentUser: getCurrentUserMock,
    }),
  );

  mock.module("@/lib/csrf", () => ({
    isSameOrigin: isSameOriginMock,
  }));

  mock.module("@/lib/auth", () => ({
    auth: {
      api: {
        signInEmail: signInEmailMock,
        signUpEmail: signUpEmailMock,
      },
    },
  }));

  mock.module("@/lib/prisma", () => ({
    default: prismaMock,
  }));

  mock.module("@/lib/rate-limit", () => ({
    checkRateLimit: checkRateLimitMock,
    getClientIdentifier: getClientIdentifierMock,
  }));
}

function restoreModuleMocks() {
  mock.module("next/headers", () => actualNextHeaders);
  mock.module("next/cache", () => actualNextCache);
  mock.module("@/lib/api-utils", () => createApiUtilsModule());
  mock.module("@/lib/csrf", () => actualCsrf);
  mock.module("@/lib/auth", () => ({ ...actualAuth }));
  mock.module("@/lib/prisma", () => ({ default: actualPrisma.default }));
  mock.module("@/lib/rate-limit", () => actualRateLimit);
}

function createRequest(body: string, cookieValue?: string, includeOrigin = true) {
  return {
    headers: new Headers({
      "content-type": "application/json",
      ...(includeOrigin ? { origin: "http://localhost:3000" } : {}),
    }),
    cookies: {
      get: (_name: string) =>
        cookieValue ? { name: "eduteams-demo-visitor", value: cookieValue } : undefined,
    },
    text: async () => body,
  } as any;
}

describe("POST /api/demo/switch-role", () => {
  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    delete process.env.DEV_ALLOWED_ORIGINS;

    getCurrentUserMock.mockReset();
    signInEmailMock.mockReset();
    signUpEmailMock.mockReset();
    cookieStoreDeleteMock.mockReset();
    nextCookiesMock.mockReset();
    nextHeadersMock.mockReset();
    revalidateTagMock.mockReset();
    isSameOriginMock.mockReset();
    checkRateLimitMock.mockReset();
    getClientIdentifierMock.mockReset();
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
    prismaMock.user.delete.mockReset();
    prismaMock.account.create.mockReset();
    prismaMock.account.update.mockReset();
    prismaMock.personalityProfile.upsert.mockReset();
    prismaMock.course.findMany.mockReset();
    prismaMock.courseEnrollment.createMany.mockReset();
    prismaMock.$transaction.mockReset();

    signInEmailMock.mockResolvedValue(undefined);
    signUpEmailMock.mockResolvedValue({ user: { id: "created-user" } });
    cookieStoreDeleteMock.mockImplementation(() => undefined);
    nextCookiesMock.mockResolvedValue({ delete: cookieStoreDeleteMock });
    nextHeadersMock.mockResolvedValue(new Headers());
    isSameOriginMock.mockImplementation((request: { headers: Headers }) =>
      Boolean(request.headers.get("origin") || request.headers.get("referer")),
    );
    checkRateLimitMock.mockReturnValue({ allowed: true, retryAfterSeconds: 60 });
    getClientIdentifierMock.mockReturnValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.user.delete.mockResolvedValue({});
    prismaMock.account.create.mockResolvedValue({});
    prismaMock.account.update.mockResolvedValue({});
    prismaMock.personalityProfile.upsert.mockResolvedValue({});
    prismaMock.course.findMany.mockResolvedValue([]);
    prismaMock.courseEnrollment.createMany.mockResolvedValue({ count: 0 });
    prismaMock.$transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === "function") {
        return input(prismaMock as any);
      }

      return [];
    });

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();

    if (originalDevAllowedOrigins === undefined) {
      delete process.env.DEV_ALLOWED_ORIGINS;
      return;
    }

    process.env.DEV_ALLOWED_ORIGINS = originalDevAllowedOrigins;
  });

  it("rejects non-demo sessions instead of minting a demo identity", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "real-user",
      email: "teacher@example.com",
    });

    const { POST } = await import("../route");
    const res = await POST(createRequest(JSON.stringify({ role: "TEACHER" }), "visitor1234"));

    expect(res.status).toBe(403);
    expect(signInEmailMock).not.toHaveBeenCalled();
    expect(signUpEmailMock).not.toHaveBeenCalled();
  });

  it("repairs stale demo credentials without deleting the existing demo user", async () => {
    const visitorId = "visitor1234";
    const teacherAccount = getDemoAccount("TEACHER", visitorId);

    getCurrentUserMock.mockResolvedValue({
      id: "demo-user",
      email: teacherAccount.email,
    });
    signInEmailMock
      .mockRejectedValueOnce({
        body: { code: "INVALID_EMAIL_OR_PASSWORD" },
      })
      .mockResolvedValueOnce(undefined);
    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email === teacherAccount.email) {
        return {
          id: "stale-user",
          accounts: [{ id: "account-1", password: "hashed-password" }],
        };
      }

      return null;
    });

    const { POST } = await import("../route");
    const res = await POST(createRequest(JSON.stringify({ role: "TEACHER" }), visitorId));

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(signInEmailMock).toHaveBeenCalledTimes(2);
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
    expect(signUpEmailMock).not.toHaveBeenCalled();
    expect(prismaMock.account.update).toHaveBeenCalledWith({
      where: { id: "account-1" },
      data: { password: expect.any(String) },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "stale-user" },
      data: {
        role: "TEACHER",
        isOnboarded: true,
        hasSeenWelcomeSplash: true,
        onboardingStep: null,
        name: teacherAccount.name,
        gender: teacherAccount.gender,
        nim: teacherAccount.nim,
      },
    });
  });

  it("sets the demo sandbox cookie after a successful role switch", async () => {
    const visitorId = "visitor1234";
    const teacherAccount = getDemoAccount("TEACHER", visitorId);

    getCurrentUserMock.mockResolvedValue({
      id: "demo-user",
      email: teacherAccount.email,
    });

    const { POST } = await import("../route");
    const { parseDemoSandboxCookieValue } = await import("@/lib/demo/sandbox");
    const res = await POST(createRequest(JSON.stringify({ role: "TEACHER" }), visitorId));
    const sandboxCookieValue = res.headers
      .get("set-cookie")
      ?.match(/eduteams-demo-sandbox=([^;]+)/)?.[1];

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("eduteams-demo-sandbox=");
    await expect(parseDemoSandboxCookieValue(sandboxCookieValue)).resolves.toEqual({
      version: 1,
      role: "TEACHER",
      onboarded: true,
      userId: "created-user",
      email: teacherAccount.email,
    });
  });

  it("repairs missing demo credentials without recreating the user row", async () => {
    const visitorId = "visitor1234";
    const teacherAccount = getDemoAccount("TEACHER", visitorId);

    getCurrentUserMock.mockResolvedValue({
      id: "demo-user",
      email: teacherAccount.email,
    });
    signInEmailMock
      .mockRejectedValueOnce({
        body: { code: "USER_NOT_FOUND" },
      })
      .mockResolvedValueOnce(undefined);
    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email === teacherAccount.email) {
        return {
          id: "teacher-user",
          accounts: [],
        };
      }

      return null;
    });

    const { POST } = await import("../route");
    const res = await POST(createRequest(JSON.stringify({ role: "TEACHER" }), visitorId));

    expect(res.status).toBe(200);
    expect(signInEmailMock).toHaveBeenCalledTimes(2);
    expect(signUpEmailMock).not.toHaveBeenCalled();
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
    expect(prismaMock.account.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        userId: "teacher-user",
        accountId: "teacher-user",
        providerId: "credential",
        password: expect.any(String),
      },
    });
  });

  it("revalidates student and teacher course caches after demo enrollment changes", async () => {
    const visitorId = "visitor1234";
    const teacherAccount = getDemoAccount("TEACHER", visitorId);
    const studentAccount = getDemoAccount("STUDENT", visitorId);

    getCurrentUserMock.mockResolvedValue({
      id: "teacher-session",
      email: teacherAccount.email,
    });

    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email === studentAccount.email) {
        return { id: "student-user" };
      }

      if (where.email === teacherAccount.email) {
        return { id: "teacher-user" };
      }

      return null;
    });
    prismaMock.course.findMany.mockResolvedValue([{ id: "course-1" }]);
    prismaMock.courseEnrollment.createMany.mockResolvedValue({ count: 1 });

    const { POST } = await import("../route");
    const res = await POST(createRequest(JSON.stringify({ role: "STUDENT" }), visitorId));

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(signInEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ email: studentAccount.email }),
      }),
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "student-user" },
      data: {
        role: "STUDENT",
        isOnboarded: true,
        hasSeenWelcomeSplash: true,
        onboardingStep: null,
        name: studentAccount.name,
        gender: studentAccount.gender,
        nim: studentAccount.nim,
      },
    });
    expect(revalidateTagMock.mock.calls.map((call) => call[0])).toEqual([
      CACHE_TAGS.studentClasses("student-user"),
      CACHE_TAGS.coursesByDosen("teacher-user"),
    ]);
  });

  it("returns 400 for malformed JSON bodies", async () => {
    const visitorId = "visitor1234";
    getCurrentUserMock.mockResolvedValue({
      id: "demo-user",
      email: getDemoAccount("TEACHER", visitorId).email,
    });

    const { POST } = await import("../route");
    const res = await POST(createRequest("not-json", visitorId));

    expect(res.status).toBe(400);
    expect(signInEmailMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid role values", async () => {
    const visitorId = "visitor1234";
    getCurrentUserMock.mockResolvedValue({
      id: "demo-user",
      email: getDemoAccount("TEACHER", visitorId).email,
    });

    const { POST } = await import("../route");
    const res = await POST(createRequest(JSON.stringify({ role: "ADMIN" }), visitorId));

    expect(res.status).toBe(400);
    expect(signInEmailMock).not.toHaveBeenCalled();
  });

  it("does not create a session before syncing an existing demo account", async () => {
    const visitorId = "visitor1234";
    const teacherAccount = getDemoAccount("TEACHER", visitorId);

    getCurrentUserMock.mockResolvedValue({
      id: "demo-user",
      email: teacherAccount.email,
    });
    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email === teacherAccount.email) {
        return { id: "teacher-user" };
      }

      return null;
    });
    prismaMock.user.update.mockRejectedValue(new Error("sync failed"));

    const { POST } = await import("../route");
    const res = await POST(createRequest(JSON.stringify({ role: "TEACHER" }), visitorId));

    expect(res.status).toBe(500);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(signInEmailMock).not.toHaveBeenCalled();
  });

  it("clears auth state when sync fails after sign-up", async () => {
    const visitorId = "visitor1234";
    const teacherAccount = getDemoAccount("TEACHER", visitorId);

    getCurrentUserMock.mockResolvedValue({
      id: "demo-user",
      email: teacherAccount.email,
    });
    signInEmailMock.mockRejectedValue({
      body: { code: "USER_NOT_FOUND" },
    });
    prismaMock.user.update.mockRejectedValue(new Error("sync failed"));

    const { POST } = await import("../route");
    const res = await POST(createRequest(JSON.stringify({ role: "STUDENT" }), visitorId));

    expect(res.status).toBe(500);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: "created-user" },
    });
    expect(res.headers.get("set-cookie")).toContain("better-auth.session_token=");
  });

  it("accepts the configured LAN dev origin", async () => {
    process.env.DEV_ALLOWED_ORIGINS = "http://100.119.116.81:3000";

    const visitorId = "visitor1234";
    getCurrentUserMock.mockResolvedValue({
      id: "demo-user",
      email: getDemoAccount("TEACHER", visitorId).email,
    });

    const { POST } = await import("../route");
    const res = await POST({
      headers: new Headers({
        "content-type": "application/json",
        origin: "http://100.119.116.81:3000",
      }),
      cookies: {
        get: () => ({
          name: "eduteams-demo-visitor",
          value: visitorId,
        }),
      },
      text: async () => JSON.stringify({ role: "STUDENT" }),
    } as any);

    expect(res.status).toBe(200);
    expect(signUpEmailMock).toHaveBeenCalled();
  });

  it("rejects requests when origin and referer are both missing", async () => {
    const visitorId = "visitor1234";
    getCurrentUserMock.mockResolvedValue({
      id: "demo-user",
      email: getDemoAccount("TEACHER", visitorId).email,
    });

    const { POST } = await import("../route");
    const res = await POST(createRequest(JSON.stringify({ role: "STUDENT" }), visitorId, false));

    expect(res.status).toBe(403);
    expect(signInEmailMock).not.toHaveBeenCalled();
    expect(signUpEmailMock).not.toHaveBeenCalled();
  });
});
