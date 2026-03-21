import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { createApiUtilsModule } from "@/test-utils/api-utils-module";

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

let currentUser = {
  id: "s1",
  email: "student@example.com",
  role: "STUDENT",
  isOnboarded: true,
};

const prismaMock: any = {
  courseEnrollment: {
    findUnique: mock(async (args: any) =>
      args?.where?.courseId_studentId?.courseId === "c1"
        ? {
            courseId: "c1",
            studentId: args.where.courseId_studentId.studentId,
            course: {
              id: "c1",
              namaMataKuliah: "Algoritma",
              kelas: "RA",
              dosenId: "u1",
            },
          }
        : null,
    ),
    delete: mock(async () => ({})),
  },
};

function applyModuleMocks() {
  mock.module("@/lib/api-utils", () =>
    createApiUtilsModule({
      getCurrentUser: async () => currentUser as any,
    }),
  );
  mock.module("next/cache", () => ({ revalidateTag: () => {} }));
  mock.module("@/lib/csrf", () => ({ isSameOrigin: () => true }));
  mock.module("@/lib/prisma", () => ({ default: prismaMock }));
}

describe("POST /api/student/leave-class", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    currentUser = {
      id: "s1",
      email: "student@example.com",
      role: "STUDENT",
      isOnboarded: true,
    };
    prismaMock.courseEnrollment.findUnique.mockReset();
    prismaMock.courseEnrollment.delete.mockReset();
    prismaMock.courseEnrollment.findUnique.mockImplementation(async (args: any) =>
      args?.where?.courseId_studentId?.courseId === "c1"
        ? {
            courseId: "c1",
            studentId: args.where.courseId_studentId.studentId,
            course: {
              id: "c1",
              namaMataKuliah: "Algoritma",
              kelas: "RA",
              dosenId: "u1",
            },
          }
        : null,
    );
    prismaMock.courseEnrollment.delete.mockResolvedValue({});
    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();

    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
      return;
    }

    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  afterAll(() => {
    mock.restore();
  });

  it("leaves class when enrolled", async () => {
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/student/leave-class", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-host": "localhost",
      },
      body: JSON.stringify({ courseId: "c1" }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.courseEnrollment.delete).toHaveBeenCalled();
  });

  it("returns 404 when not enrolled", async () => {
    prismaMock.courseEnrollment.findUnique.mockImplementationOnce(async () => null);
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/student/leave-class", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-host": "localhost",
      },
      body: JSON.stringify({ courseId: "cX" }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(404);
  });
});
