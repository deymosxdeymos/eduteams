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

  it("skips nonce forwarding for redirect responses", async () => {
    const sandboxCookie = await demoCookieValue("TEACHER");
    const { middleware } = await import("@/middleware");
    const request = createRequest(
      "/login",
      `eduteams-demo-sandbox=${encodeURIComponent(sandboxCookie)}`,
    );

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("x-nonce")).toBeNull();
    expect(response.headers.get("Content-Security-Policy")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-nonce")).toBeNull();
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

  it("forwards only the CSP nonce into Next.js request header overrides", async () => {
    const { middleware } = await import("@/middleware");
    const request = createRequest("/", "foo=bar; theme=dark");

    const response = await middleware(request);
    const nonce = response.headers.get("x-nonce");
    const csp = response.headers.get("Content-Security-Policy");

    expect(typeof nonce).toBe("string");
    expect(nonce).not.toHaveLength(0);
    expect(csp).toContain(`'nonce-${nonce}'`);

    const overrideHeaders =
      response.headers
        .get("x-middleware-override-headers")
        ?.split(",")
        .map((header) => header.trim().toLowerCase())
        .toSorted() ?? [];

    expect(overrideHeaders).toEqual(["x-nonce"]);
    expect(response.headers.get("x-middleware-request-content-security-policy")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
    expect(response.headers.get("x-middleware-request-cookie")).toBeNull();
  });

  it("allows local development connections only in the development CSP", async () => {
    const { buildCsp } = await import("@/middleware");

    expect(buildCsp("nonce-dev", { isDevelopment: true })).toContain(
      "connect-src 'self' https: http: ws:",
    );
    expect(buildCsp("nonce-prod", { isDevelopment: false })).toContain("connect-src 'self' https:");
    expect(buildCsp("nonce-prod", { isDevelopment: false })).not.toContain(" ws:");
  });
});
