import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: "u1",
      name: "User",
      nim: "123",
      role: "TEACHER",
      gender: "MALE",
      email: "teacher@if.itera.ac.id",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isOnboarded: true,
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    })),
    update: mock(async () => ({})),
  },
};

function registerPrismaMock() {
  mock.module("@/lib/prisma", () => ({ default: prismaMock }));
}

describe("user/data-diri API", () => {
  beforeEach(() => {
    mock.restore();
    registerPrismaMock();
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "User",
      nim: "123",
      role: "TEACHER",
      gender: "MALE",
      email: "teacher@if.itera.ac.id",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isOnboarded: true,
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    });
  });

  afterEach(() => {
    mock.restore();
  });

  it("GET returns mapped user fields", async () => {
    mock.module("@/lib/auth", () => ({
      auth: { api: { getSession: async () => ({ user: { id: "u1" } }) } },
    }));
    const { GET } = await import("../route");
    const res = await GET(
      new Request("http://localhost/api/user/data-diri") as any,
      undefined as any,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.jenisKelamin).toBe("laki-laki");
    expect(json.data.role).toBe("TEACHER");
  });

  it("POST updates user and requires role-specific fields", async () => {
    mock.module("@/lib/auth", () => ({
      auth: { api: { getSession: async () => ({ user: { id: "u1" } }) } },
    }));
    const { POST } = await import("../route");
    const reqOk = new Request("http://localhost/api/user/data-diri", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        namaLengkap: "U",
        jenisKelamin: "laki-laki",
      }),
    });
    const resOk = await POST(reqOk as any, undefined as any);
    expect(resOk.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        name: "U",
        nim: null,
        gender: "MALE",
      },
    });

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Student",
      nim: null,
      role: "STUDENT",
      gender: "FEMALE",
      email: "student@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isOnboarded: true,
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    });
    const reqFail = new Request("http://localhost/api/user/data-diri", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        namaLengkap: "U",
        jenisKelamin: "perempuan",
      }),
    });
    const resFail = await POST(reqFail as any, undefined as any);
    expect(resFail.status).toBe(400);
  });
});
