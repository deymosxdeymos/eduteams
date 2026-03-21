import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const actualAuth = await import("@/lib/auth");

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: "u1",
      role: null,
      isOnboarded: true,
      name: "User",
      email: "teacher@if.itera.ac.id",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      nim: null,
      gender: null,
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    })),
    update: mock(async () => ({})),
  },
};

function registerMocks() {
  mock.module("@/lib/auth", () => ({
    ...actualAuth,
    auth: { api: { getSession: async () => ({ user: { id: "u1" } }) } },
  }));

  mock.module("@/lib/prisma", () => ({
    default: prismaMock,
  }));
}

describe("POST /api/user/role", () => {
  beforeEach(() => {
    mock.restore();
    registerMocks();
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      role: null,
      isOnboarded: true,
      name: "User",
      email: "teacher@if.itera.ac.id",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      nim: null,
      gender: null,
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    });
  });

  afterEach(() => {
    mock.restore();
  });

  it("updates role for eligible teacher accounts", async () => {
    const { POST } = await import("../route");

    const req = new Request("http://localhost/api/user/role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "TEACHER" }),
    });

    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { role: "TEACHER" },
    });
  });

  it("rejects teacher role for non-institutional accounts", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      role: null,
      isOnboarded: true,
      name: "User",
      email: "person@gmail.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      nim: null,
      gender: null,
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    });

    const { POST } = await import("../route");

    const req = new Request("http://localhost/api/user/role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "TEACHER" }),
    });

    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(403);
    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
    expect(json.error).toBe("Institutional email required for teacher role");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects admin payloads", async () => {
    const { POST } = await import("../route");

    const req = new Request("http://localhost/api/user/role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "ADMIN" }),
    });

    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(400);
    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
  });
});
