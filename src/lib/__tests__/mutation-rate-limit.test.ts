import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const checkRateLimitMock = mock(async () => ({
  allowed: true,
  retryAfterSeconds: 0,
}));
const getClientIdentifierMock = mock(() => "198.51.100.9");

function applyModuleMocks() {
  mock.module("@/lib/rate-limit", () => ({
    checkRateLimit: checkRateLimitMock,
    getClientIdentifier: getClientIdentifierMock,
  }));
}

describe("checkMutationRateLimit", () => {
  beforeEach(() => {
    mock.restore();
    applyModuleMocks();
    checkRateLimitMock.mockReset();
    getClientIdentifierMock.mockReset();
    checkRateLimitMock.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    getClientIdentifierMock.mockReturnValue("198.51.100.9");
  });

  afterEach(() => {
    mock.restore();
  });

  it("returns ip scope when the shared IP bucket is blocked", async () => {
    checkRateLimitMock.mockImplementation(async ({ key }: { key: string }) => {
      if (key === "assignment-create:ip:198.51.100.9") {
        return { allowed: false, retryAfterSeconds: 45 };
      }

      return { allowed: true, retryAfterSeconds: 0 };
    });

    const { checkMutationRateLimit } = await import("../mutation-rate-limit");
    const result = await checkMutationRateLimit({ headers: new Headers() } as any, {
      keyPrefix: "assignment-create",
      userId: "teacher-1",
      windowMs: 600_000,
      perIp: 20,
      perUser: 10,
    });

    expect(result).toEqual({
      allowed: false,
      scope: "ip",
      retryAfterSeconds: 45,
    });
    expect(checkRateLimitMock).toHaveBeenCalledTimes(1);
    expect(checkRateLimitMock.mock.calls[0]?.[0]?.key).toBe("assignment-create:ip:198.51.100.9");
  });

  it("returns user scope when user bucket is blocked but IP passes", async () => {
    checkRateLimitMock.mockImplementation(async ({ key }: { key: string }) => {
      if (key === "course-create:user:user-1") {
        return { allowed: false, retryAfterSeconds: 30 };
      }

      return { allowed: true, retryAfterSeconds: 0 };
    });

    const { checkMutationRateLimit } = await import("../mutation-rate-limit");
    const result = await checkMutationRateLimit({ headers: new Headers() } as any, {
      keyPrefix: "course-create",
      userId: "user-1",
      windowMs: 600_000,
      perIp: 12,
      perUser: 6,
    });

    expect(result).toEqual({
      allowed: false,
      scope: "user",
      retryAfterSeconds: 30,
    });
    const calledKeys = new Set(checkRateLimitMock.mock.calls.map(([args]) => args.key));
    expect(calledKeys).toEqual(
      new Set(["course-create:ip:198.51.100.9", "course-create:user:user-1"]),
    );
  });

  it("reuses a provided client identifier instead of parsing headers again", async () => {
    const { checkMutationRateLimit } = await import("../mutation-rate-limit");
    const result = await checkMutationRateLimit({ headers: new Headers() } as any, {
      keyPrefix: "form-teams",
      userId: "teacher-1",
      windowMs: 600_000,
      perIp: 15,
      perUser: 8,
      clientIdentifier: "203.0.113.7",
    });

    expect(result).toEqual({ allowed: true });
    expect(getClientIdentifierMock).not.toHaveBeenCalled();
    const calledKeys = new Set(checkRateLimitMock.mock.calls.map(([args]) => args.key));
    expect(calledKeys).toEqual(new Set(["form-teams:ip:203.0.113.7", "form-teams:user:teacher-1"]));
  });
});
