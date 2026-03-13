import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { NextResponse } from "next/server";

const actualAuth = await import("@/lib/auth");
const actualNextHeaders = await import("next/headers");
const actualPrisma = await import("@/lib/prisma");

const authGetSessionMock = mock(async () => null);
const cookiesMock = mock(async () => ({
  get: (_name: string) => undefined,
}));
const headersMock = mock(async () => new Headers());

const prismaMock = {
  user: {
    findUnique: mock(async ({ where }: { where: { id: string } }) => {
      if (where.id !== "u1") {
        return null;
      }

      return {
        id: "u1",
        name: "Real Teacher",
        email: "teacher@example.com",
        emailVerified: true,
        image: null,
        role: "TEACHER",
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        nim: null,
        gender: "FEMALE",
        hasSeenWelcomeSplash: true,
        onboardingStep: null,
        onboardingData: null,
        personalityProfile: null,
      };
    }),
  },
};

function applyModuleMocks() {
  mock.module("@/lib/auth", () => ({
    ...actualAuth,
    auth: {
      api: {
        getSession: authGetSessionMock,
      },
    },
  }));

  mock.module("next/headers", () => ({
    cookies: cookiesMock,
    headers: headersMock,
  }));

  mock.module("@/lib/prisma", () => ({
    default: prismaMock,
  }));
}

function restoreModuleMocks() {
  mock.module("@/lib/auth", () => ({ ...actualAuth }));
  mock.module("next/headers", () => actualNextHeaders);
  mock.module("@/lib/prisma", () => ({ default: actualPrisma.default }));
}

async function demoCookieValue(role: "TEACHER" | "STUDENT") {
  const { stringifyDemoSandboxCookieValue } = await import("@/lib/demo/sandbox");

  return stringifyDemoSandboxCookieValue({
    version: 1,
    role,
    onboarded: true,
    userId: role === "TEACHER" ? "demo-teacher-user" : "demo-student-user",
    email:
      role === "TEACHER"
        ? "demo.teacher.visitor-alpha@eduteams.local"
        : "demo.student.visitor-alpha@eduteams.local",
  });
}

describe("api-utils demo auth", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.DEMO_MODE = "1";

    authGetSessionMock.mockReset();
    cookiesMock.mockReset();
    headersMock.mockReset();
    prismaMock.user.findUnique.mockReset();

    authGetSessionMock.mockResolvedValue(null);
    cookiesMock.mockResolvedValue({
      get: (_name: string) => undefined,
    });
    headersMock.mockResolvedValue(new Headers());
    prismaMock.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === "u1") {
        return {
          id: "u1",
          name: "Real Teacher",
          email: "teacher@example.com",
          emailVerified: true,
          image: null,
          role: "TEACHER",
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: null,
          gender: "FEMALE",
          hasSeenWelcomeSplash: true,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.id === "demo-student-user") {
        return {
          id: "demo-student-user",
          name: "Demo Student",
          email: "demo.student.visitor-alpha@eduteams.local",
          emailVerified: true,
          image: null,
          role: "STUDENT",
          isOnboarded: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: "20260001",
          gender: "MALE",
          hasSeenWelcomeSplash: false,
          onboardingStep: "kepribadian",
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.id === "demo-teacher-user") {
        return {
          id: "demo-teacher-user",
          name: "Demo Teacher",
          email: "demo.teacher.visitor-alpha@eduteams.local",
          emailVerified: true,
          image: null,
          role: "TEACHER",
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: null,
          gender: "FEMALE",
          hasSeenWelcomeSplash: true,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      return null;
    });

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it("keeps the real session user when the sandbox cookie does not belong to a demo account", async () => {
    const sandboxCookie = await demoCookieValue("STUDENT");
    authGetSessionMock.mockResolvedValue({
      user: { id: "u1" },
      session: {
        id: "session-u1",
        expiresAt: new Date(),
        token: "token-u1",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "u1",
      },
    });
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "eduteams-demo-sandbox" ? { value: sandboxCookie } : undefined,
    });

    const { getCurrentUser } = await import("@/lib/api-utils");
    const user = await getCurrentUser();

    expect(user?.id).toBe("u1");
    expect(user?.email).toBe("teacher@example.com");
  });

  it("falls back to the real demo account from the sandbox cookie when there is no auth session", async () => {
    const sandboxCookie = await demoCookieValue("STUDENT");
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "eduteams-demo-sandbox" ? { value: sandboxCookie } : undefined,
    });

    const { getCurrentUser } = await import("@/lib/api-utils");
    const user = await getCurrentUser();

    expect(user?.id).toBe("demo-student-user");
    expect(user?.email).toBe("demo.student.visitor-alpha@eduteams.local");
    expect(user?.role).toBe("STUDENT");
  });

  it("fails closed when the sandbox cookie does not include a real demo identity", async () => {
    const { stringifyDemoSandboxCookieValue } = await import("@/lib/demo/sandbox");
    const sandboxCookie = await stringifyDemoSandboxCookieValue({
      version: 1,
      role: "STUDENT",
      onboarded: true,
    });
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "eduteams-demo-sandbox" ? { value: sandboxCookie } : undefined,
    });

    const { getCurrentUser } = await import("@/lib/api-utils");
    const user = await getCurrentUser();

    expect(user).toBeNull();
  });

  it("keeps the real authenticated id for demo-account sessions", async () => {
    const sandboxCookie = await demoCookieValue("STUDENT");
    authGetSessionMock.mockResolvedValue({
      user: { id: "demo-user" },
      session: {
        id: "session-demo-user",
        expiresAt: new Date(),
        token: "token-demo-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "demo-user",
      },
    });
    prismaMock.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id !== "demo-user") {
        return null;
      }

      return {
        id: "demo-user",
        name: "Demo Teacher",
        email: "demo.teacher.visitor-alpha@eduteams.local",
        emailVerified: true,
        image: null,
        role: "TEACHER",
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        nim: null,
        gender: "FEMALE",
        hasSeenWelcomeSplash: true,
        onboardingStep: null,
        onboardingData: null,
        personalityProfile: null,
      };
    });
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "eduteams-demo-sandbox" ? { value: sandboxCookie } : undefined,
    });

    const { getCurrentUser } = await import("@/lib/api-utils");
    const user = await getCurrentUser();

    expect(user?.id).toBe("demo-user");
    expect(user?.email).toBe("demo.teacher.visitor-alpha@eduteams.local");
  });

  it("still treats real demo-account sessions as sandbox users", async () => {
    const sandboxCookie = await demoCookieValue("STUDENT");
    authGetSessionMock.mockResolvedValue({
      user: { id: "demo-user" },
      session: {
        id: "session-demo-user",
        expiresAt: new Date(),
        token: "token-demo-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "demo-user",
      },
    });
    prismaMock.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id !== "demo-user") {
        return null;
      }

      return {
        id: "demo-user",
        name: "Demo Teacher",
        email: "demo.teacher.visitor-alpha@eduteams.local",
        emailVerified: true,
        image: null,
        role: "TEACHER",
        isOnboarded: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        nim: null,
        gender: "FEMALE",
        hasSeenWelcomeSplash: false,
        onboardingStep: null,
        onboardingData: null,
        personalityProfile: null,
      };
    });
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "eduteams-demo-sandbox" ? { value: sandboxCookie } : undefined,
    });

    const { getCurrentUser } = await import("@/lib/api-utils");
    const { isDemoSandboxUser } = await import("@/lib/demo/sandbox");
    const user = await getCurrentUser();

    expect(user?.id).toBe("demo-user");
    expect(isDemoSandboxUser(user)).toBe(true);
  });

  it("fails closed when a stale auth session points to a missing user even if a demo cookie exists", async () => {
    const sandboxCookie = await demoCookieValue("STUDENT");
    authGetSessionMock.mockResolvedValue({
      user: { id: "missing-user" },
      session: {
        id: "session-missing-user",
        expiresAt: new Date(),
        token: "token-missing-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "missing-user",
      },
    });
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "eduteams-demo-sandbox" ? { value: sandboxCookie } : undefined,
    });

    const { getCurrentUser } = await import("@/lib/api-utils");
    const user = await getCurrentUser();

    expect(user).toBeNull();
  });

  it("blocks unsafe mutations for demo sandbox users by default", async () => {
    const sandboxCookie = await demoCookieValue("TEACHER");
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "eduteams-demo-sandbox" ? { value: sandboxCookie } : undefined,
    });

    const { withAuth } = await import("@/lib/api-utils");
    const handler = withAuth(async () => NextResponse.json({ success: true }));
    const response = await handler(
      new Request("http://localhost/api/test", { method: "POST" }) as any,
      undefined as any,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "Demo sandbox sessions can only use demo-enabled actions.",
    });
  });

  it("allows explicitly demo-safe mutations to opt in", async () => {
    const sandboxCookie = await demoCookieValue("TEACHER");
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "eduteams-demo-sandbox" ? { value: sandboxCookie } : undefined,
    });

    const { withAuth } = await import("@/lib/api-utils");
    const handler = withAuth(
      async (_request, context) => NextResponse.json({ success: true, userId: context.user.id }),
      { allowDemoSandbox: true },
    );
    const response = await handler(
      new Request("http://localhost/api/test", { method: "POST" }) as any,
      undefined as any,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      userId: "demo-teacher-user",
    });
  });
});
