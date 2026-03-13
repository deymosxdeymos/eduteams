import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const actualApiUtils = await import("@/lib/api-utils");
const getCurrentUserMock = mock(async () => ({
  id: "teacher-db-id",
  email: "demo.teacher.visitor1234@eduteams.local",
  role: "TEACHER",
  isOnboarded: true,
}));
const nextCookiesMock = mock(async () => ({
  get: (name: string) =>
    name === "eduteams-demo-sandbox-roster"
      ? {
          value: JSON.stringify({
            version: 1,
            removedStudentIds: ["demo-sandbox-student-2"],
          }),
        }
      : undefined,
}));

const prismaMock: any = {
  course: {
    findUnique: mock(async () => null),
  },
  courseEnrollment: {
    findUnique: mock(async () => null),
  },
};

mock.module("@/lib/api-utils", () => ({
  ...actualApiUtils,
  getCurrentUser: getCurrentUserMock,
}));

mock.module("next/headers", () => ({
  cookies: nextCookiesMock,
}));

mock.module("@/lib/prisma", () => ({ default: prismaMock }));

describe("GET /api/courses/[id]/students", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.DEMO_MODE = "1";
    getCurrentUserMock.mockReset();
    getCurrentUserMock.mockResolvedValue({
      id: "teacher-db-id",
      email: "demo.teacher.visitor1234@eduteams.local",
      role: "TEACHER",
      isOnboarded: true,
    });
    nextCookiesMock.mockReset();
    nextCookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "eduteams-demo-sandbox-roster"
          ? {
              value: JSON.stringify({
                version: 1,
                removedStudentIds: ["demo-sandbox-student-2"],
              }),
            }
          : undefined,
    });
    prismaMock.course.findUnique.mockReset();
    prismaMock.courseEnrollment.findUnique.mockReset();
    prismaMock.course.findUnique.mockResolvedValue(null);
    prismaMock.courseEnrollment.findUnique.mockResolvedValue(null);
  });

  afterEach(() => {
    mock.restore();

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it("returns the synthetic demo roster without hitting Prisma access checks", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      new Request("http://localhost/api/courses/demo-sandbox-course/students") as any,
      { params: Promise.resolve({ id: "demo-sandbox-course" }) },
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as any;
    expect(json.data.map((student: { id: string }) => student.id)).not.toContain(
      "demo-sandbox-student-2",
    );
    expect(prismaMock.course.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.courseEnrollment.findUnique).not.toHaveBeenCalled();
  });
});
