import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

const actualCsrf = await import("@/lib/csrf");
const actualCleanup = await import("@/lib/demo/cleanup");
const deleteDemoVisitorDataMock = mock(async () => ({ visitorId: null, deletedUserCount: 0 }));
const isSameOriginMock = mock(() => true);

function applyModuleMocks() {
  mock.module("@/lib/csrf", () => ({
    ...actualCsrf,
    isSameOrigin: isSameOriginMock,
  }));
  mock.module("@/lib/demo/cleanup", () => ({
    ...actualCleanup,
    deleteDemoVisitorData: deleteDemoVisitorDataMock,
  }));
}

function restoreModuleMocks() {
  mock.module("@/lib/csrf", () => actualCsrf);
  mock.module("@/lib/demo/cleanup", () => actualCleanup);
}

describe("/api/auth/clear-session", () => {
  beforeEach(() => {
    deleteDemoVisitorDataMock.mockReset();
    isSameOriginMock.mockReset();
    deleteDemoVisitorDataMock.mockResolvedValue({ visitorId: null, deletedUserCount: 0 });
    isSameOriginMock.mockReturnValue(true);
    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();
  });

  it("GET deletes current demo data for same-origin requests", async () => {
    const { GET } = await import("../route");
    const request = new NextRequest("http://localhost/api/auth/clear-session?redirect=/dashboard", {
      headers: { referer: "http://localhost/dashboard" },
    });

    const response = await GET(request);
    const cookieNames = response.cookies.getAll().map((cookie) => cookie.name);

    expect(isSameOriginMock).toHaveBeenCalledWith(request);
    expect(deleteDemoVisitorDataMock).toHaveBeenCalledWith(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
    expect(cookieNames).toEqual(
      expect.arrayContaining([
        "better-auth.session_token",
        "__Secure-better-auth.session_token",
        "better-auth.session_data",
        "__Secure-better-auth.session_data",
        "better-auth.dont_remember",
        "__Secure-better-auth.dont_remember",
        "eduteams-demo-sandbox",
        "eduteams-demo-sandbox-roster",
        "eduteams-demo-visitor",
        "eduteams-demo-visitor-public",
      ]),
    );
  });

  it("GET skips demo cleanup for cross-site requests while clearing session cookies", async () => {
    isSameOriginMock.mockReturnValue(false);

    const { GET } = await import("../route");
    const request = new NextRequest("http://localhost/api/auth/clear-session?redirect=/dashboard", {
      headers: { referer: "https://attacker.example/logout" },
    });

    const response = await GET(request);
    const cookieNames = response.cookies.getAll().map((cookie) => cookie.name);

    expect(isSameOriginMock).toHaveBeenCalledWith(request);
    expect(deleteDemoVisitorDataMock).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
    expect(cookieNames).toEqual(
      expect.arrayContaining([
        "better-auth.session_token",
        "__Secure-better-auth.session_token",
        "better-auth.session_data",
        "__Secure-better-auth.session_data",
        "better-auth.dont_remember",
        "__Secure-better-auth.dont_remember",
        "eduteams-demo-sandbox",
        "eduteams-demo-sandbox-roster",
      ]),
    );
    expect(cookieNames).not.toContain("eduteams-demo-visitor");
    expect(cookieNames).not.toContain("eduteams-demo-visitor-public");
  });

  it("GET clears demo sandbox cookies even without origin or referer headers", async () => {
    isSameOriginMock.mockReturnValue(false);

    const { GET } = await import("../route");
    const request = new NextRequest("http://localhost/api/auth/clear-session?redirect=/dashboard");

    const response = await GET(request);
    const cookieNames = response.cookies.getAll().map((cookie) => cookie.name);

    expect(isSameOriginMock).toHaveBeenCalledWith(request);
    expect(deleteDemoVisitorDataMock).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
    expect(cookieNames).toContain("eduteams-demo-sandbox");
    expect(cookieNames).toContain("eduteams-demo-sandbox-roster");
    expect(cookieNames).not.toContain("eduteams-demo-visitor");
    expect(cookieNames).not.toContain("eduteams-demo-visitor-public");
  });

  it("POST deletes current demo data before redirecting", async () => {
    const { POST } = await import("../route");
    const request = new NextRequest("http://localhost/api/auth/clear-session?redirect=/dashboard", {
      method: "POST",
      headers: { origin: "http://localhost" },
    });

    const response = await POST(request);

    expect(isSameOriginMock).toHaveBeenCalledWith(request);
    expect(deleteDemoVisitorDataMock).toHaveBeenCalledWith(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("POST rejects cross-site cleanup attempts", async () => {
    isSameOriginMock.mockReturnValue(false);

    const { POST } = await import("../route");
    const request = new NextRequest("http://localhost/api/auth/clear-session?redirect=/dashboard", {
      method: "POST",
    });

    const response = await POST(request);

    expect(deleteDemoVisitorDataMock).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
