import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const authGetSessionMock = mock(async () => ({ user: { id: "u1" } }));
const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: "u1",
      role: "STUDENT",
      isOnboarded: true,
    })),
    update: mock(async () => ({})),
  },
};

function registerMocks() {
  mock.module("@/lib/auth", () => ({
    auth: { api: { getSession: authGetSessionMock } },
  }));
  mock.module("@/lib/prisma", () => ({ default: prismaMock }));
}

describe("POST /api/user/welcome-splash", () => {
  beforeEach(() => {
    mock.restore();
    registerMocks();
    delete process.env.DEMO_MODE;
    authGetSessionMock.mockClear();
    authGetSessionMock.mockResolvedValue({ user: { id: "u1" } });
    prismaMock.user.findUnique.mockClear();
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      role: "STUDENT",
      isOnboarded: true,
    });
    prismaMock.user.update.mockClear();
  });

  afterEach(() => {
    mock.restore();
  });

  it("marks welcome splash as seen", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://localhost/api/user/welcome-splash") as any,
      undefined as any,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { hasSeenWelcomeSplash: true },
    });
  });

  it("marks welcome splash as seen for demo users", async () => {
    process.env.DEMO_MODE = "1";
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "demo.teacher.visitor-alpha@eduteams.local",
      role: "TEACHER",
      isOnboarded: true,
    });

    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://localhost/api/user/welcome-splash") as any,
      undefined as any,
    );

    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { hasSeenWelcomeSplash: true },
    });
  });
});
