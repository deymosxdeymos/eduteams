import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { createApiUtilsModule } from "@/test-utils/api-utils-module";

const getCurrentUserMock = mock(async () => ({
  id: "u1",
  email: "teacher@example.com",
  role: "TEACHER",
  isOnboarded: true,
}));

const checkMutationRateLimitMock = mock(async () => ({ allowed: true }));
const createRateLimitResponseMock = mock(
  (rateLimit: { scope: "ip" | "user" }, messages: { ip: string; user: string }) =>
    Response.json(
      {
        success: false,
        error: rateLimit.scope === "ip" ? messages.ip : messages.user,
      },
      { status: 429 },
    ),
);

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: "u1",
      email: "teacher@example.com",
      role: "TEACHER",
      isOnboarded: true,
    })),
  },
  course: {
    findFirst: mock(async (args: any) =>
      args?.where?.dosenId === "u1" && args?.where?.id === "c1"
        ? { id: "c1", dosenId: "u1" }
        : null,
    ),
  },
  courseEnrollment: {
    findUnique: mock(async (args: any) =>
      args?.where?.courseId_studentId?.courseId === "c1" &&
      args?.where?.courseId_studentId?.studentId === "s1"
        ? { courseId: "c1", studentId: "s1" }
        : null,
    ),
    findMany: mock(async () => []),
  },
  assignment: {
    findMany: mock(async (args: any) => {
      const isSelectingSubmissions = args?.select?.submissions && args.select.submissions !== false;
      return [
        {
          id: "a1",
          courseId: "c1",
          title: "Tugas 1",
          description: null,
          startAt: new Date("2025-01-01T00:00:00Z"),
          createdAt: new Date("2025-01-02T00:00:00Z"),
          status: "BELUM_ISI",
          _count: { submissions: 2 },
          ...(isSelectingSubmissions ? { submissions: [{ id: "sub1" }] } : {}),
        },
      ];
    }),
    create: mock(async (args: any) => ({
      id: "a2",
      ...args.data,
      createdAt: new Date("2025-01-03T00:00:00Z"),
      status: "BELUM_ISI",
      structureVersion: 1,
    })),
  },
  assignmentSubmission: {
    createMany: mock(async () => ({ count: 0 })),
  },
  personSkill: {
    createMany: mock(async () => ({ count: 0 })),
  },
  assignmentTopicPreference: {
    createMany: mock(async () => ({ count: 0 })),
  },
  skill: {
    findMany: mock(async () => []),
    createMany: mock(async () => ({ count: 0 })),
  },
  courseSkill: {
    findMany: mock(async () => []),
    createMany: mock(async () => ({ count: 0 })),
  },
  assignmentTopic: {
    findMany: mock(async () => []),
    createMany: mock(async () => ({ count: 0 })),
  },
  $transaction: mock(async (callback: any) => {
    // Execute callback with prismaMock as transaction context
    return await callback(prismaMock);
  }),
};

mock.module("@/lib/prisma", () => ({ default: prismaMock }));
mock.module("@/lib/api-utils", () => createApiUtilsModule({ getCurrentUser: getCurrentUserMock }));
mock.module("@/lib/mutation-rate-limit", () => ({
  checkMutationRateLimit: checkMutationRateLimitMock,
  createRateLimitResponse: createRateLimitResponseMock,
}));

describe("courses/[id]/assignments API", () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
    checkMutationRateLimitMock.mockReset();
    createRateLimitResponseMock.mockReset();
    getCurrentUserMock.mockResolvedValue({
      id: "u1",
      email: "teacher@example.com",
      role: "TEACHER",
      isOnboarded: true,
    });
    checkMutationRateLimitMock.mockResolvedValue({ allowed: true });
    createRateLimitResponseMock.mockImplementation(
      (rateLimit: { scope: "ip" | "user" }, messages: { ip: string; user: string }) =>
        Response.json(
          {
            success: false,
            error: rateLimit.scope === "ip" ? messages.ip : messages.user,
          },
          { status: 429 },
        ),
    );
  });

  afterAll(() => {
    mock.restore();
  });
  it("GET returns assignments for dosen owner without submittedByMe", async () => {
    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/courses/c1/assignments") as any,
      { params: Promise.resolve({ id: "c1" }) } as any,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].id).toBe("a1");
    expect(json.data[0].submittedByMe).toBeUndefined();
  });

  it("GET returns assignments for mahasiswa with submittedByMe", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "s1",
      email: "student@example.com",
      role: "STUDENT",
      isOnboarded: true,
    });

    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/courses/c1/assignments") as any,
      { params: Promise.resolve({ id: "c1" }) } as any,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data[0].submittedByMe).toBe(true);
  });

  it("GET returns 404 for dosen non-owner", async () => {
    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/courses/wrong/assignments") as any,
      { params: Promise.resolve({ id: "wrong" }) } as any,
    );
    expect(res.status).toBe(404);
  });

  it("POST creates assignment for dosen owner with 201", async () => {
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/courses/c1/assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "T2",
        description: "  desc  ",
        skills: ["Frontend"],
        topics: ["Topic1", " Topic2 "],
      }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: "c1" }) } as any);
    expect(res.status).toBe(201);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.skills).toEqual(["Frontend"]);
    expect(json.data.topics).toEqual(["Topic1", "Topic2"]);
  });

  it("POST denies mahasiswa", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "s1",
      email: "student@example.com",
      role: "STUDENT",
      isOnboarded: true,
    });

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/courses/c1/assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "T", skills: [], topics: [] }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: "c1" }) } as any);
    expect(res.status).toBe(403);
  });
});
