import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const revalidateTagMock = mock(() => {});

mock.module("next/cache", () => ({ revalidateTag: revalidateTagMock }));

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: "u1",
      role: "TEACHER",
      isOnboarded: true,
    })),
  },
  course: {
    findFirst: mock(async (args: any) => (args?.where?.dosenId === "u1" ? { id: "c1" } : null)),
  },
  courseEnrollment: {
    findUnique: mock(async (args: any) =>
      args?.where?.courseId_studentId?.studentId === "s1"
        ? { courseId: "c1", studentId: "s1" }
        : null,
    ),
    delete: mock(async () => ({})),
  },
};

mock.module("@/lib/prisma", () => ({ default: prismaMock }));

describe("DELETE /api/courses/[id]/students/[studentId]", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    revalidateTagMock.mockReset();
    prismaMock.user.findUnique.mockReset();
    prismaMock.course.findFirst.mockReset();
    prismaMock.courseEnrollment.findUnique.mockReset();
    prismaMock.courseEnrollment.delete.mockReset();
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      role: "TEACHER",
      isOnboarded: true,
    });
    prismaMock.course.findFirst.mockImplementation(async (args: any) =>
      args?.where?.dosenId === "u1" ? { id: "c1" } : null,
    );
    prismaMock.courseEnrollment.findUnique.mockImplementation(async (args: any) =>
      args?.where?.courseId_studentId?.studentId === "s1"
        ? { courseId: "c1", studentId: "s1" }
        : null,
    );
    prismaMock.courseEnrollment.delete.mockResolvedValue({});
  });

  afterEach(() => {
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it("removes student from course for dosen owner", async () => {
    mock.module("@/lib/auth", () => ({
      auth: { api: { getSession: async () => ({ user: { id: "u1" } }) } },
    }));
    const { DELETE } = await import("../route");
    const res = await DELETE(
      new Request("http://localhost/api/courses/c1/students/s1") as any,
      { params: Promise.resolve({ id: "c1", studentId: "s1" }) } as any,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.removed).toBe(true);
  });

  it("removes students from the synthetic demo roster for authenticated demo teachers", async () => {
    process.env.DEMO_MODE = "1";
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "teacher-db-id",
      email: "demo.teacher.visitor1234@eduteams.local",
      role: "TEACHER",
      isOnboarded: true,
    });
    mock.module("@/lib/auth", () => ({
      auth: { api: { getSession: async () => ({ user: { id: "teacher-db-id" } }) } },
    }));

    const request = {
      method: "DELETE",
      cookies: {
        get: () => undefined,
      },
    } as any;

    const { DELETE } = await import("../route");
    const res = await DELETE(request, {
      params: Promise.resolve({
        id: "demo-sandbox-course",
        studentId: "demo-sandbox-student-2",
      }),
    } as any);

    expect(res.status).toBe(200);
    expect(prismaMock.course.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.courseEnrollment.delete).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie")).toContain("eduteams-demo-sandbox-roster=");
  });

  it("blocks removing the required synthetic demo student", async () => {
    process.env.DEMO_MODE = "1";
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "teacher-db-id",
      email: "demo.teacher.visitor1234@eduteams.local",
      role: "TEACHER",
      isOnboarded: true,
    });
    mock.module("@/lib/auth", () => ({
      auth: { api: { getSession: async () => ({ user: { id: "teacher-db-id" } }) } },
    }));

    const request = {
      method: "DELETE",
      cookies: {
        get: () => undefined,
      },
    } as any;

    const { DELETE } = await import("../route");
    const res = await DELETE(request, {
      params: Promise.resolve({
        id: "demo-sandbox-course",
        studentId: "demo-sandbox-student",
      }),
    } as any);

    expect(res.status).toBe(403);
    expect(prismaMock.course.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.courseEnrollment.delete).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
