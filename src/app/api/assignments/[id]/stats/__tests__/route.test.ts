import { afterEach, describe, expect, it, mock } from "bun:test";

function statsFixture(overrides: Partial<any> = {}) {
  return {
    mbti: [{ kategori: "INTJ", jumlah: 1 }],
    gender: [{ name: "laki", value: 2 }],
    skills: [{ label: "Frontend", value: 80 }],
    topicPreferences: [{ name: "Topic1", value: 90 }],
    teamsFormed: false,
    quizSubmissions: 1,
    chartReady: true,
    ...overrides,
  };
}

const getSessionMock = mock(async () => ({ user: { id: "u1" } }));
const getAssignmentStatsMock = mock(async () => statsFixture());

const prismaMock: any = {
  user: {
    findUnique: mock(async ({ where }: any) => ({
      id: where?.id ?? "u1",
      role: "TEACHER",
      isOnboarded: true,
    })),
  },
  assignment: {
    findUnique: mock(async (args: any) =>
      args?.where?.id === "a1" ? { id: "a1", courseId: "c1", course: { dosenId: "u1" } } : null,
    ),
  },
};

mock.module("@/lib/auth", () => ({
  auth: { api: { getSession: getSessionMock } },
}));

mock.module("@/lib/prisma", () => ({ default: prismaMock }));

mock.module("@/lib/stats/assignment", () => ({
  getAssignmentStats: getAssignmentStatsMock,
}));

describe("GET /api/assignments/[id]/stats", () => {
  afterEach(() => {
    getSessionMock.mockReset();
    getSessionMock.mockResolvedValue({ user: { id: "u1" } });
    getAssignmentStatsMock.mockReset();
    getAssignmentStatsMock.mockResolvedValue(statsFixture());
  });

  it("returns stats from service", async () => {
    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/assignments/a1/stats") as any,
      { params: Promise.resolve({ id: "a1" }) } as any,
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.mbti[0].kategori).toBe("INTJ");
  });

  it("zeros values when zeroIfNoTeams=1 and no teams formed", async () => {
    getAssignmentStatsMock.mockResolvedValueOnce(
      statsFixture({
        mbti: [{ kategori: "INTJ", jumlah: 3 }],
        gender: [{ name: "perempuan", value: 5 }],
        skills: [{ label: "Backend", value: 70 }],
        topicPreferences: [{ name: "Topic2", value: 50 }],
        quizSubmissions: 4,
        chartReady: true,
      }),
    );

    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/assignments/a1/stats?zeroIfNoTeams=1") as any,
      { params: Promise.resolve({ id: "a1" }) } as any,
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.mbti[0].jumlah).toBe(0);
    expect(json.data.gender[0].value).toBe(0);
    expect(json.data.skills[0].value).toBe(0);
    expect(json.data.topicPreferences[0].value).toBe(0);
    expect(json.data.quizSubmissions).toBe(0);
    expect(json.data.chartReady).toBe(false);
  });

  it("returns 404 if assignment not found", async () => {
    prismaMock.assignment.findUnique.mockImplementationOnce(async () => null);

    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/assignments/ax/stats") as any,
      { params: Promise.resolve({ id: "ax" }) } as any,
    );

    expect(res.status).toBe(404);
  });

  it("returns 403 for enrolled students", async () => {
    getSessionMock.mockResolvedValueOnce({ user: { id: "student-1" } });
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: "student-1",
      role: "STUDENT",
      isOnboarded: true,
    }));

    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/assignments/a1/stats") as any,
      { params: Promise.resolve({ id: "a1" }) } as any,
    );

    expect(res.status).toBe(403);
  });

  it("allows admins to view stats outside the course roster", async () => {
    getSessionMock.mockResolvedValueOnce({ user: { id: "admin-1" } });
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: "admin-1",
      role: "ADMIN",
      isOnboarded: true,
    }));

    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/assignments/a1/stats") as any,
      { params: Promise.resolve({ id: "a1" }) } as any,
    );

    expect(res.status).toBe(200);
  });
});
