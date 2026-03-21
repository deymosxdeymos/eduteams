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
            description: JSON.stringify({ text: "old", skills: ["A"], topics: ["X"] }),
            status: "MENUNGGU",
            course: { dosenId: "u1" },
            _count: { submissions: 3 },
          }
        : null,
    ),
  },
};

function registerMocks() {
  mock.module("@/lib/auth", () => ({
    auth: { api: { getSession: async () => ({ user: { id: currentUser.id } }) } },
  }));
  mock.module("@/lib/prisma", () => ({ default: prismaMock }));
}

describe("POST /api/assignments/[id]/check-edit-impact", () => {
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
    prismaMock.user.findUnique.mockImplementation(async () => currentUser);
    prismaMock.assignment.findUnique.mockImplementation(async (args: any) =>
      args?.where?.id === "a1"
        ? {
            id: "a1",
            courseId: "c1",
            description: JSON.stringify({ text: "old", skills: ["A"], topics: ["X"] }),
            status: "MENUNGGU",
            course: { dosenId: "u1" },
            _count: { submissions: 3 },
          }
        : null,
    );
  });

  afterEach(() => {
    mock.restore();
  });

  it("returns impact details for the course owner", async () => {
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/assignments/a1/check-edit-impact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ skills: ["A"], topics: ["X", "Y"] }),
    });

    const res = await POST(req as any, { params: Promise.resolve({ id: "a1" }) } as any);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      data: expect.objectContaining({ tier: expect.any(Number) }),
    });
  });
});
