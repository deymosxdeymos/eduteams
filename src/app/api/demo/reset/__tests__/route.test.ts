import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const actualCsrf = await import("@/lib/csrf");
const actualCleanup = await import("@/lib/demo/cleanup");
const isSameOriginMock = mock(() => true);
const deleteDemoVisitorDataMock = mock(async () => ({ visitorId: null, deletedUserCount: 0 }));

function applyModuleMocks() {
  mock.module("@/lib/csrf", () => ({
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

function createRequest(includeOrigin = true) {
  return {
    headers: new Headers(includeOrigin ? { origin: "http://localhost:3000" } : {}),
  } as any;
}

describe("POST /api/demo/reset", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    isSameOriginMock.mockReset();
    deleteDemoVisitorDataMock.mockReset();
    isSameOriginMock.mockReturnValue(true);
    deleteDemoVisitorDataMock.mockResolvedValue({ visitorId: null, deletedUserCount: 0 });
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

  it("returns 404 when demo mode is disabled", async () => {
    delete process.env.DEMO_MODE;

    const { POST } = await import("../route");
    const response = await POST(createRequest());

    expect(response.status).toBe(404);
  });

  it("deletes current demo data and clears the sandbox and Better Auth session cookies", async () => {
    const { POST } = await import("../route");
    const request = createRequest();
    const response = await POST(request);

    expect(deleteDemoVisitorDataMock).toHaveBeenCalledWith(request);
    expect(response.status).toBe(200);
    expect(response.cookies.getAll().map((cookie) => cookie.name)).toEqual(
      expect.arrayContaining([
        "eduteams-demo-sandbox",
        "eduteams-demo-sandbox-roster",
        "eduteams-demo-visitor",
        "eduteams-demo-visitor-public",
        "better-auth.session_token",
        "__Secure-better-auth.session_token",
        "better-auth.session_data",
        "__Secure-better-auth.session_data",
        "better-auth.dont_remember",
        "__Secure-better-auth.dont_remember",
      ]),
    );
  });

  it("rejects cross-site reset requests", async () => {
    isSameOriginMock.mockReturnValue(false);

    const { POST } = await import("../route");
    const response = await POST(createRequest(false));

    expect(response.status).toBe(403);
  });
});
