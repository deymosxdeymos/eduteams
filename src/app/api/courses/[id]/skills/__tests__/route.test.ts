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
  course: {
    findFirst: mock(async () => ({ id: "course-1" })),
  },
  skill: {
    findUnique: mock(async () => null),
    create: mock(async () => ({ id: "skill-1", name: "Leadership" })),
  },
  courseSkill: {
    findMany: mock(async () => []),
    findUnique: mock(async () => null),
    create: mock(async () => ({ id: "course-skill-1" })),
  },
};

mock.module("@/lib/prisma", () => ({ default: prismaMock }));
mock.module("@/lib/auth", () => ({
  auth: { api: { getSession: async () => ({ user: { id: "t1" } }) } },
}));

describe("/api/courses/[id]/skills", () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.course.findFirst.mockReset();
    prismaMock.skill.findUnique.mockReset();
    prismaMock.skill.create.mockReset();
    prismaMock.courseSkill.findMany.mockReset();
    prismaMock.courseSkill.findUnique.mockReset();
    prismaMock.courseSkill.create.mockReset();
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
    prismaMock.course.findFirst.mockResolvedValue({ id: "course-1" });
    prismaMock.skill.findUnique.mockResolvedValue(null);
    prismaMock.skill.create.mockResolvedValue({ id: "skill-1", name: "Leadership" });
    prismaMock.courseSkill.findMany.mockResolvedValue([]);
    prismaMock.courseSkill.findUnique.mockResolvedValue(null);
  });

  it("returns synthetic demo course skills for demo teachers", async () => {
    process.env.DEMO_MODE = "1";
    prismaMock.user.findUnique.mockResolvedValue({
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

    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/courses/demo-sandbox-course/skills?q=data") as any,
      { params: Promise.resolve({ id: "demo-sandbox-course" }) } as any,
    );

    expect(res.status).toBe(200);
    expect(prismaMock.course.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.courseSkill.findMany).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      data: [{ id: "Data Analysis", name: "Data Analysis" }],
    });

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }
  });

  it("rejects demo teachers from creating course skills through the shared skill table", async () => {
    process.env.DEMO_MODE = "1";
    prismaMock.user.findUnique.mockResolvedValue({
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
    const req = new Request("http://localhost/api/courses/course-1/skills", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Leadership" }),
    });

    const res = await POST(req as any, { params: Promise.resolve({ id: "course-1" }) } as any);

    expect(res.status).toBe(403);
    expect(prismaMock.skill.create).not.toHaveBeenCalled();
    expect(prismaMock.courseSkill.create).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toMatchObject({
      error: "Demo accounts cannot modify shared skills",
      success: false,
    });
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }
  });
});
