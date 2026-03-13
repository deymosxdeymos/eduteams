import { beforeEach, describe, expect, it, mock } from "bun:test";

const originalDemoMode = process.env.DEMO_MODE;

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: "t1",
      role: "TEACHER",
      isOnboarded: true,
      name: "Teacher",
      email: "teacher@if.itera.ac.id",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      nim: null,
      gender: "FEMALE",
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    })),
  },
  skill: {
    findUnique: mock(async () => null),
    create: mock(async () => ({
      id: "skill-1",
      name: "Leadership",
      description: null,
    })),
  },
};

mock.module("@/lib/prisma", () => ({ default: prismaMock }));
mock.module("@/lib/auth", () => ({
  auth: { api: { getSession: async () => ({ user: { id: "t1" } }) } },
}));

describe("POST /api/skills", () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.skill.findUnique.mockReset();
    prismaMock.skill.create.mockReset();
    prismaMock.user.findUnique.mockResolvedValue({
      id: "t1",
      role: "TEACHER",
      isOnboarded: true,
      name: "Teacher",
      email: "teacher@if.itera.ac.id",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      nim: null,
      gender: "FEMALE",
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    });
    prismaMock.skill.findUnique.mockResolvedValue(null);
    prismaMock.skill.create.mockResolvedValue({
      id: "skill-1",
      name: "Leadership",
      description: null,
    });
  });

  it("rejects demo teachers from modifying shared skills", async () => {
    process.env.DEMO_MODE = "1";
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "t1",
      role: "TEACHER",
      isOnboarded: true,
      name: "Demo Teacher",
      email: "demo.teacher.visitor1234@eduteams.local",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      nim: null,
      gender: "FEMALE",
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    });

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Leadership" }),
    });

    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(403);
    expect(prismaMock.skill.create).not.toHaveBeenCalled();
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }
  });
});
