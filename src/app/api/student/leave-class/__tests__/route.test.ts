import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { NextResponse } from "next/server";

const actualApiUtils = await import("@/lib/api-utils");
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
  mock.module("@/lib/api-utils", () => ({
    ...actualApiUtils,
    withAuth: (handler: any, options?: { allowDemoSandbox?: boolean }) => {
      return async (request: Request, context: unknown) => {
        const isUnsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(request.method);
        const isDemoUser = currentUser.email.startsWith("demo.");

        if (isUnsafeMethod && isDemoUser && !options?.allowDemoSandbox) {
          return NextResponse.json(
            {
              success: false,
              error: "Demo sandbox sessions can only use demo-enabled actions.",
            },
            { status: 403 },
          );
        }

        return handler(request, { ...(context as object), user: currentUser });
      };
    },
  }));
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

  it("allows demo-account students to leave classes", async () => {
    currentUser = {
      id: "demo-student-user",
      email: "demo.student.visitor-alpha@eduteams.local",
      role: "STUDENT",
      isOnboarded: true,
    };

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
    expect(prismaMock.courseEnrollment.delete).toHaveBeenCalledWith({
      where: {
        courseId_studentId: {
          courseId: "c1",
          studentId: "demo-student-user",
        },
      },
    });
  });
});
