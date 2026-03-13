import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const actualAuth = await import("@/lib/auth");

// Mock auth + prisma before importing route
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

  it("updates role for authenticated user", async () => {
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

  it("allows demo sandbox users to keep their scoped role", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      role: "STUDENT",
      isOnboarded: true,
      name: "Demo Student",
      email: "demo.student.visitor1234@eduteams.local",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      nim: "20260001",
      gender: "MALE",
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    });

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/user/role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "STUDENT" }),
    });

    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { role: "STUDENT" },
    });
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

  it("prevents demo accounts from switching out of their scoped role", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      role: "STUDENT",
      isOnboarded: true,
      name: "Demo Student",
      email: "demo.student.visitor1234@eduteams.local",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      nim: "20260001",
      gender: "MALE",
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
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
