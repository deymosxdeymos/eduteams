import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const actualAuth = await import("@/lib/auth");

// Mock auth session and prisma before importing route handler
const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: "u1",
      role: "TEACHER",
      isOnboarded: true,
      name: "Dosen",
      email: "dosen@example.com",
    })),
  },
  assignment: { count: mock(async () => 5) },
  team: {
    count: mock(async () => 12),
    aggregate: mock(async () => ({
      _avg: { quality: 0.5 },
      _min: { quality: 0.1 },
      _max: { quality: 0.9 },
      _count: { _all: 12 },
    })),
  },
};

function registerMocks() {
  mock.module("@/lib/auth", () => ({
    ...actualAuth,
    auth: { api: { getSession: async () => ({ user: { id: "u1" } }) } },
  }));

  mock.module("@/lib/prisma", () => ({
    default: prismaMock,
  }));
}

describe("GET /api/dashboard/statistics", () => {
  beforeEach(() => {
    mock.restore();
    registerMocks();
    prismaMock.user.findUnique.mockReset();
    prismaMock.assignment.count.mockReset();
    prismaMock.team.count.mockReset();
    prismaMock.team.aggregate.mockReset();
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      role: "TEACHER",
      isOnboarded: true,
      name: "Dosen",
      email: "dosen@example.com",
    });
    prismaMock.assignment.count.mockResolvedValue(5);
    prismaMock.team.count.mockResolvedValue(12);
    prismaMock.team.aggregate.mockResolvedValue({
      _avg: { quality: 0.5 },
      _min: { quality: 0.1 },
      _max: { quality: 0.9 },
      _count: { _all: 12 },
    });
  });

  afterEach(() => {
    mock.restore();
  });

  it("returns aggregated statistics for dosen", async () => {
    const { GET } = await import("../route");

    const res = await GET(
      new Request("http://localhost/api/dashboard/statistics") as any,
      undefined as any,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data).toEqual({
      totalAssignments: 5,
      totalTeams: 12,
      avgTeamQuality: 0.5,
      qualitySummary: {
        min: 0.1,
        max: 0.9,
        mean: 0.5,
        n: 12,
      },
    });
  });

  it("denies access for non-dosen users", async () => {
    // Change user role to mahasiswa
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: "u1",
      role: "STUDENT",
      isOnboarded: true,
      name: "Student",
      email: "student@example.com",
    }));

    const { GET } = await import("../route");

    const res = await GET(
      new Request("http://localhost/api/dashboard/statistics") as any,
      undefined as any,
    );
    expect(res.status).toBe(403);
    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
    expect(json.error).toBe("Access denied");
  });
});
