import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

let currentUser = {
  id: "u1",
  email: "teacher@example.com",
  role: "TEACHER",
  isOnboarded: true,
};

const prismaMock: any = {
  user: {
    findUnique: mock(async () => currentUser),
  },
  assignment: {
    findUnique: mock(async (args: any) =>
      args?.where?.id === "a1"
        ? {
            id: "a1",
            courseId: "c1",
            title: "T",
            description: JSON.stringify({ text: "old", skills: ["A"], topics: ["X"] }),
            status: "MENUNGGU",
            structureVersion: 1,
            course: { dosenId: "u1" },
            _count: { submissions: 0 },
          }
        : null,
    ),
    update: mock(async (args: any) => ({
      id: "a1",
      courseId: "c1",
      title: args.data.title ?? "T",
      description:
        args.data.description ?? JSON.stringify({ text: "old", skills: ["A"], topics: ["X"] }),
      startAt: new Date("2025-01-01T00:00:00Z"),
      createdAt: new Date("2024-12-31T00:00:00Z"),
      status: args.data.status ?? "MENUNGGU",
      structureVersion: args.data.structureVersion ?? 1,
      _count: { submissions: 0 },
    })),
  },
};

function registerMocks() {
  mock.module("@/lib/auth", () => ({
    auth: {
      api: {
        getSession: async () => ({ user: { id: currentUser.id } }),
      },
    },
  }));
  mock.module("@/lib/prisma", () => ({ default: prismaMock }));
  mock.module("@/lib/utils/assignment-skills-topics", () => ({
    ensureSkillsForCourse: mock(async () => undefined),
    ensureTopicsForAssignment: mock(async () => undefined),
  }));
  mock.module("@/lib/utils/assignment-snapshot", () => ({
    createAssignmentSnapshot: mock(async () => undefined),
    invalidateAssignmentSubmissions: mock(async () => undefined),
    markSubmissionsNeedUpdate: mock(async () => undefined),
  }));
}

describe("PATCH /api/assignments/[id]", () => {
  beforeEach(() => {
    mock.restore();
    currentUser = {
      id: "u1",
      email: "teacher@example.com",
      role: "TEACHER",
      isOnboarded: true,
    };
    registerMocks();
    prismaMock.user.findUnique.mockReset();
    prismaMock.assignment.findUnique.mockReset();
    prismaMock.assignment.update.mockReset();
    prismaMock.user.findUnique.mockImplementation(async () => currentUser);
    prismaMock.assignment.findUnique.mockImplementation(async (args: any) =>
      args?.where?.id === "a1"
        ? {
            id: "a1",
            courseId: "c1",
            title: "T",
            description: JSON.stringify({ text: "old", skills: ["A"], topics: ["X"] }),
            status: "MENUNGGU",
            structureVersion: 1,
            course: { dosenId: "u1" },
            _count: { submissions: 0 },
          }
        : null,
    );
    prismaMock.assignment.update.mockImplementation(async (args: any) => ({
      id: "a1",
      courseId: "c1",
      title: args.data.title ?? "T",
      description:
        args.data.description ?? JSON.stringify({ text: "old", skills: ["A"], topics: ["X"] }),
      startAt: new Date("2025-01-01T00:00:00Z"),
      createdAt: new Date("2024-12-31T00:00:00Z"),
      status: args.data.status ?? "MENUNGGU",
      structureVersion: args.data.structureVersion ?? 1,
      _count: { submissions: 0 },
    }));
  });

  afterEach(() => {
    mock.restore();
  });

  it("updates assignment title for owner", async () => {
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/assignments/a1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "New" }),
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "a1" }) } as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.title).toBe("New");
  });

  it("returns 403 for non-owner", async () => {
    prismaMock.assignment.findUnique.mockImplementationOnce(async () => ({
      id: "a1",
      courseId: "c1",
      title: "T",
      description: null,
      status: "MENUNGGU",
      structureVersion: 1,
      course: { dosenId: "uX" },
      _count: { submissions: 0 },
    }));
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/assignments/a1", {
      method: "PATCH",
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "a1" }) } as any);
    expect(res.status).toBe(403);
  });

  it("preserves legacy plain-text descriptions when updating structure", async () => {
    prismaMock.assignment.findUnique.mockImplementationOnce(async () => ({
      id: "a1",
      courseId: "c1",
      title: "T",
      description: "Legacy description",
      status: "MENUNGGU",
      structureVersion: 1,
      course: { dosenId: "u1" },
      _count: { submissions: 0 },
    }));

    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/assignments/a1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ skills: ["Frontend"] }),
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "a1" }) } as any);

    expect(res.status).toBe(200);
    expect(prismaMock.assignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: JSON.stringify({
            text: "Legacy description",
            skills: ["Frontend"],
          }),
        }),
      }),
    );
  });

  it("allows demo-account teachers to edit persisted assignments", async () => {
    currentUser = {
      id: "demo-teacher-user",
      email: "demo.teacher.visitor-alpha@eduteams.local",
      role: "TEACHER",
      isOnboarded: true,
    };
    prismaMock.assignment.findUnique.mockImplementationOnce(async () => ({
      id: "a1",
      courseId: "c1",
      title: "T",
      description: JSON.stringify({ text: "old", skills: ["A"], topics: ["X"] }),
      status: "MENUNGGU",
      structureVersion: 1,
      course: { dosenId: "demo-teacher-user" },
      _count: { submissions: 0 },
    }));

    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/assignments/a1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated by Demo" }),
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "a1" }) } as any);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      data: expect.objectContaining({ title: "Updated by Demo" }),
    });
  });
});
