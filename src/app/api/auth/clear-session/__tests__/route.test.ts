import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

const actualCsrf = await import("@/lib/csrf");
const isSameOriginMock = mock(() => true);

function applyModuleMocks() {
  mock.module("@/lib/csrf", () => ({
    ...actualCsrf,
    isSameOrigin: isSameOriginMock,
  }));
}

describe("/api/auth/clear-session", () => {
  beforeEach(() => {
    isSameOriginMock.mockReset();
    isSameOriginMock.mockReturnValue(true);
    applyModuleMocks();
  });

  it("GET redirects to the specified path and clears Better Auth cookies", async () => {
    const { GET } = await import("../route");
    const request = new NextRequest("http://localhost/api/auth/clear-session?redirect=/dashboard", {
      headers: {
        cookie:
          "better-auth.session_token=token; better-auth.session_data.0=chunk-0; __Secure-better-auth.dont_remember=true",
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");

    const setCookies = response.headers.getSetCookie();
    expect(setCookies.some((cookie) => cookie.includes("better-auth.session_token=;"))).toBe(true);
    expect(setCookies.some((cookie) => cookie.includes("better-auth.session_data=;"))).toBe(true);

    const secureCookie = setCookies.find((cookie) =>
      cookie.includes("__Secure-better-auth.dont_remember=;"),
    );
    expect(secureCookie).toBeDefined();
    expect(secureCookie).toContain("Secure");
  });

  it("GET clears __Secure session cookies with the Secure attribute", async () => {
    const { GET } = await import("../route");
    const request = new NextRequest("https://example.com/api/auth/clear-session", {
      headers: {
        cookie: "__Secure-better-auth.session_data=chunk-0",
      },
    });

    const response = await GET(request);
    const setCookies = response.headers.getSetCookie();
    const secureSessionCookie = setCookies.find((cookie) =>
      cookie.includes("__Secure-better-auth.session_data=;"),
    );

    expect(secureSessionCookie).toBeDefined();
    expect(secureSessionCookie).toContain("Secure");
  });

  it("GET defaults to / when no redirect param", async () => {
    const { GET } = await import("../route");
    const request = new NextRequest("http://localhost/api/auth/clear-session");

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("POST redirects for same-origin requests", async () => {
    const { POST } = await import("../route");
    const request = new NextRequest("http://localhost/api/auth/clear-session?redirect=/dashboard", {
      method: "POST",
      headers: { origin: "http://localhost" },
    });

    const response = await POST(request);

    expect(isSameOriginMock).toHaveBeenCalledWith(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("POST rejects cross-site requests", async () => {
    isSameOriginMock.mockReturnValue(false);

    const { POST } = await import("../route");
    const request = new NextRequest("http://localhost/api/auth/clear-session?redirect=/dashboard", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });
});
