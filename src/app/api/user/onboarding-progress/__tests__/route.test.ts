import { describe, expect, it, mock } from "bun:test";

const actualAuth = await import("@/lib/auth");

// Mock auth + prisma before importing route
const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: "u1",
      role: "STUDENT",
      isOnboarded: false,
      name: "User",
      email: "user@example.com",
    })),
    update: mock(async () => ({})),
  },
};

mock.module("@/lib/auth", () => ({
  ...actualAuth,
  auth: { api: { getSession: async () => ({ user: { id: "u1" } }) } },
}));

mock.module("@/lib/prisma", () => ({
  default: prismaMock,
}));

describe("POST /api/user/onboarding-progress", () => {
  it("updates onboardingStep for authenticated user", async () => {
    const { POST } = await import("../route");

    const req = new Request("http://localhost/api/user/onboarding-progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ step: "profile" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { onboardingStep: "profile" },
    });
  });

  it("returns 401 when not authenticated", async () => {
    // Override session to be missing
    const { auth } = await import("@/lib/auth");
    (auth.api.getSession as any) = async () => ({ user: null });

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/user/onboarding-progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ step: "anything" }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });
});
