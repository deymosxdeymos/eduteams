import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { DEMO_VISITOR_COOKIE_NAME } from "@/lib/demo/auth";
import { getDemoStudentVisitorEmailPrefix } from "@/lib/demo/seed-students";
import { DEMO_SANDBOX_COOKIE_NAME, stringifyDemoSandboxCookieValue } from "@/lib/demo/sandbox";

const actualPrisma = await import("@/lib/prisma");

const prismaUserDeleteManyMock = mock(async () => ({ count: 0 }));

function applyModuleMocks() {
  mock.module("@/lib/prisma", () => ({
    default: {
      user: {
        deleteMany: prismaUserDeleteManyMock,
      },
    },
  }));
}

function restoreModuleMocks() {
  mock.module("@/lib/prisma", () => ({ default: actualPrisma.default }));
}

function createRequest(cookies: Record<string, string> = {}) {
  return {
    cookies: {
      get(name: string) {
        const value = cookies[name];
        return value ? { value } : undefined;
      },
    },
  } as const;
}

describe("demo cleanup", () => {
  beforeEach(() => {
    prismaUserDeleteManyMock.mockReset();
    prismaUserDeleteManyMock.mockResolvedValue({ count: 0 });
    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();
  });

  it("deletes demo users for the current visitor cookie", async () => {
    const { deleteDemoVisitorData } = await import("../cleanup");

    await expect(
      deleteDemoVisitorData(
        createRequest({
          [DEMO_VISITOR_COOKIE_NAME]: "visitor-alpha",
        }),
      ),
    ).resolves.toEqual({ visitorId: "visitor-alpha", deletedUserCount: 0 });

    expect(prismaUserDeleteManyMock).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: "demo.teacher.visitor-alpha@eduteams.local" },
          { email: "demo.student.visitor-alpha@eduteams.local" },
          {
            email: {
              startsWith: getDemoStudentVisitorEmailPrefix("visitor-alpha"),
            },
          },
        ],
      },
    });
  });

  it("falls back to the sandbox cookie when the visitor cookie is missing", async () => {
    const sandboxCookie = await stringifyDemoSandboxCookieValue({
      version: 1,
      role: "STUDENT",
      onboarded: true,
      userId: "demo-user",
      email: "demo.student.visitor-bravo@eduteams.local",
    });
    const { deleteDemoVisitorData } = await import("../cleanup");

    await deleteDemoVisitorData(
      createRequest({
        [DEMO_SANDBOX_COOKIE_NAME]: sandboxCookie,
      }),
    );

    expect(prismaUserDeleteManyMock).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: "demo.teacher.visitor-bravo@eduteams.local" },
          { email: "demo.student.visitor-bravo@eduteams.local" },
          {
            email: {
              startsWith: getDemoStudentVisitorEmailPrefix("visitor-bravo"),
            },
          },
        ],
      },
    });
  });

  it("skips cleanup when the request has no demo identity", async () => {
    const { deleteDemoVisitorData } = await import("../cleanup");

    await expect(deleteDemoVisitorData(createRequest())).resolves.toEqual({
      visitorId: null,
      deletedUserCount: 0,
    });
    expect(prismaUserDeleteManyMock).not.toHaveBeenCalled();
  });
});
