import { beforeEach, describe, expect, it, mock } from "bun:test";

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
});
