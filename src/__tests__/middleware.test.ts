import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest, NextResponse } from "next/server";

const actualBetterAuthCookies = await import("better-auth/cookies");
const actualIntlMiddleware = await import("next-intl/middleware");

const getSessionCookieMock = mock(() => null);
const createIntlMiddlewareMock = mock(() => (_request: NextRequest) => NextResponse.next());

function applyModuleMocks() {
  mock.module("better-auth/cookies", () => ({
    ...actualBetterAuthCookies,
    getSessionCookie: getSessionCookieMock,
  }));

  mock.module("next-intl/middleware", () => ({
    __esModule: true,
    default: createIntlMiddlewareMock,
  }));
}

function restoreModuleMocks() {
  mock.module("better-auth/cookies", () => actualBetterAuthCookies);
  mock.module("next-intl/middleware", () => ({
    __esModule: true,
    default: actualIntlMiddleware.default,
  }));
}

function createRequest(pathname: string, cookieHeader?: string) {
  const url = new URL(`http://localhost${pathname}`);
  const headers = new Headers(cookieHeader ? { cookie: cookieHeader } : undefined);
  const cookies = new Map<string, string>();

  for (const entry of cookieHeader?.split(/;\s*/u) ?? []) {
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    cookies.set(
      entry.slice(0, separatorIndex),
      decodeURIComponent(entry.slice(separatorIndex + 1)),
    );
  }

  return {
    nextUrl: url,
    url: url.toString(),
    headers,
    cookies: {
      get(name: string) {
        const value = cookies.get(name);
        return value ? { value } : undefined;
      },
    },
  } as NextRequest;
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

describe("middleware auth handling", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.DEMO_MODE = "1";

    getSessionCookieMock.mockReset();
    createIntlMiddlewareMock.mockReset();

    getSessionCookieMock.mockReturnValue(null);
    createIntlMiddlewareMock.mockReturnValue((_request: NextRequest) => NextResponse.next());

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

  it("redirects demo-cookie visitors away from login", async () => {
    const sandboxCookie = await demoCookieValue("TEACHER");
    const { middleware } = await import("@/middleware");
    const request = createRequest(
      "/login",
      `eduteams-demo-sandbox=${encodeURIComponent(sandboxCookie)}`,
    );

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("still redirects real sessions away from login even if the demo cookie exists", async () => {
    getSessionCookieMock.mockReturnValue("real-session");
    const sandboxCookie = await demoCookieValue("TEACHER");

    const { middleware } = await import("@/middleware");
    const request = createRequest(
      "/login",
      [
        "better-auth.session_token=real-session",
        `eduteams-demo-sandbox=${encodeURIComponent(sandboxCookie)}`,
      ].join("; "),
    );

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("rejects unsigned sandbox cookies on protected routes", async () => {
    const { middleware } = await import("@/middleware");
    const request = createRequest(
      "/dashboard",
      `eduteams-demo-sandbox=${encodeURIComponent('{"version":1,"role":"TEACHER","onboarded":true}')}`,
    );

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("rejects signed sandbox cookies that do not include a real demo identity", async () => {
    const { stringifyDemoSandboxCookieValue } = await import("@/lib/demo/sandbox");
    const sandboxCookie = await stringifyDemoSandboxCookieValue({
      version: 1,
      role: "TEACHER",
      onboarded: true,
    });
    const { middleware } = await import("@/middleware");
    const request = createRequest(
      "/dashboard",
      `eduteams-demo-sandbox=${encodeURIComponent(sandboxCookie)}`,
    );

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });
});
