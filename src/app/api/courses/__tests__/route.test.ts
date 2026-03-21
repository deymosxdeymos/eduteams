import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const actualAuth = await import("@/lib/auth");
const actualDashboardCourses = await import("@/lib/dashboard/courses");
const actualPrisma = await import("@/lib/prisma");

function createSession(userId: string) {
  return {
    user: { id: userId },
    session: {
      id: `session-${userId}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      token: `token-${userId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
    },
  };
}

let currentUserId: "u1" | "u2" | "u3" | "demo-teacher" = "u1";

const courseCreateMock = mock(async (args: any) => ({
  id: "c1",
  ...args.data,
  dosenId: args.data.dosenId || "u1",
  createdAt: new Date(),
  updatedAt: new Date(),
  shareToken: null,
  dosen: { id: "u1", name: "Test User", email: "test@example.com" },
}));
const seedUsersCreateManyMock = mock(async () => ({ count: 24 }));
const seedProfilesCreateManyMock = mock(async () => ({ count: 24 }));
const seedEnrollmentsCreateManyMock = mock(async () => ({ count: 24 }));
const transactionMock = mock(async (callback: (tx: any) => Promise<unknown>) =>
  callback({
    course: {
      create: courseCreateMock,
    },
    user: {
      createMany: seedUsersCreateManyMock,
      findUnique: prismaMock.user.findUnique,
    },
    personalityProfile: {
      createMany: seedProfilesCreateManyMock,
    },
    courseEnrollment: {
      createMany: seedEnrollmentsCreateManyMock,
    },
  }),
);
const authGetSessionMock = mock(async () => createSession(currentUserId));
const getCoursesForDosenMock = mock(async () => [
  {
    id: "c1",
    namaMataKuliah: "Test Course",
    kelas: "A",
    tahunAwalPeriode: 2025,
    tahunAkhirPeriode: 2025,
    periode: "ganjil",
    dosenId: "u1",
    shareToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    studentCount: 3,
    dosen: { id: "u1", name: "Test User", email: "test@example.com" },
  },
]);
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

const prismaMock = {
  $transaction: transactionMock,
  user: {
    findUnique: mock(async ({ where }: any) => {
      if (where.id === "u1") {
        return {
          id: "u1",
          name: "Test User",
          email: "test@example.com",
          emailVerified: true,
          image: null,
          role: "TEACHER",
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: null,
          gender: "MALE",
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.id === "u2") {
        return {
          id: "u2",
          name: "Mahasiswa",
          email: "student@example.com",
          emailVerified: true,
          image: null,
          role: "STUDENT",
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: "12345",
          gender: "FEMALE",
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.id === "u3") {
        return {
          id: "u3",
          name: "Pending Dosen",
          email: "pending@if.itera.ac.id",
          emailVerified: true,
          image: null,
          role: "TEACHER",
          isOnboarded: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: null,
          gender: null,
          hasSeenWelcomeSplash: false,
          onboardingStep: "role",
          onboardingData: null,
          personalityProfile: null,
        };
      }

      return null;
    }),
  },
  course: {
    findFirst: mock(async () => null),
  },
};

function applyModuleMocks() {
  mock.module("@/lib/auth", () => ({
    auth: {
      api: {
        getSession: authGetSessionMock,
      },
    },
  }));

  mock.module("@/lib/prisma", () => ({
    default: prismaMock,
  }));

  mock.module("@/lib/dashboard/courses", () => ({
    getCoursesForDosen: getCoursesForDosenMock,
  }));

  mock.module("@/lib/mutation-rate-limit", () => ({
    checkMutationRateLimit: checkMutationRateLimitMock,
    createRateLimitResponse: createRateLimitResponseMock,
  }));
}

function restoreModuleMocks() {
  mock.module("@/lib/auth", () => ({ ...actualAuth }));
  mock.module("@/lib/prisma", () => ({ default: actualPrisma.default }));
  mock.module("@/lib/dashboard/courses", () => actualDashboardCourses);
}

describe("courses API", () => {
  beforeEach(() => {
    currentUserId = "u1";

    authGetSessionMock.mockReset();
    courseCreateMock.mockReset();
    seedUsersCreateManyMock.mockReset();
    seedProfilesCreateManyMock.mockReset();
    seedEnrollmentsCreateManyMock.mockReset();
    transactionMock.mockReset();
    getCoursesForDosenMock.mockReset();
    checkMutationRateLimitMock.mockReset();
    createRateLimitResponseMock.mockReset();
    prismaMock.user.findUnique.mockReset();
    prismaMock.course.findFirst.mockReset();

    authGetSessionMock.mockResolvedValue(createSession(currentUserId));
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
    courseCreateMock.mockImplementation(async (args: any) => ({
      id: "c1",
      ...args.data,
      dosenId: args.data.dosenId || "u1",
      createdAt: new Date(),
      updatedAt: new Date(),
      shareToken: null,
      dosen: { id: "u1", name: "Test User", email: "test@example.com" },
    }));
    seedUsersCreateManyMock.mockResolvedValue({ count: 24 });
    seedProfilesCreateManyMock.mockResolvedValue({ count: 24 });
    seedEnrollmentsCreateManyMock.mockResolvedValue({ count: 24 });
    transactionMock.mockImplementation(async (callback: (tx: any) => Promise<unknown>) =>
      callback({
        course: {
          create: courseCreateMock,
        },
        user: {
          createMany: seedUsersCreateManyMock,
          findUnique: prismaMock.user.findUnique,
        },
        personalityProfile: {
          createMany: seedProfilesCreateManyMock,
        },
        courseEnrollment: {
          createMany: seedEnrollmentsCreateManyMock,
        },
      }),
    );
    getCoursesForDosenMock.mockResolvedValue([
      {
        id: "c1",
        namaMataKuliah: "Test Course",
        kelas: "A",
        tahunAwalPeriode: 2025,
        tahunAkhirPeriode: 2025,
        periode: "ganjil",
        dosenId: "u1",
        shareToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentCount: 3,
        dosen: { id: "u1", name: "Test User", email: "test@example.com" },
      },
    ]);
    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.id === "u1") {
        return {
          id: "u1",
          name: "Test User",
          email: "test@example.com",
          emailVerified: true,
          image: null,
          role: "TEACHER",
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: null,
          gender: "MALE",
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.id === "u2") {
        return {
          id: "u2",
          name: "Mahasiswa",
          email: "student@example.com",
          emailVerified: true,
          image: null,
          role: "STUDENT",
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: "12345",
          gender: "FEMALE",
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.id === "u3") {
        return {
          id: "u3",
          name: "Pending Dosen",
          email: "pending@if.itera.ac.id",
          emailVerified: true,
          image: null,
          role: "TEACHER",
          isOnboarded: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: null,
          gender: null,
          hasSeenWelcomeSplash: false,
          onboardingStep: "role",
          onboardingData: null,
          personalityProfile: null,
        };
      }

      return null;
    });
    prismaMock.course.findFirst.mockResolvedValue(null);

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();
  });

  it("POST creates course for dosen", async () => {
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        namaMataKuliah: "Algoritma",
        kelas: "RA",
        periode: "ganjil",
      }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.namaMataKuliah).toBe("Algoritma");
    expect(courseCreateMock).toHaveBeenCalled();
    expect(seedUsersCreateManyMock).not.toHaveBeenCalled();
  });

  it("POST denies non-dosen", async () => {
    currentUserId = "u2";
    authGetSessionMock.mockResolvedValue(createSession(currentUserId));

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        namaMataKuliah: "Algo",
        kelas: "RA",
        tahunAwalPeriode: 2025,
        tahunAkhirPeriode: 2025,
        periode: "ganjil",
      }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(403);
  });

  it("POST denies teachers who have not completed onboarding", async () => {
    currentUserId = "u3";
    authGetSessionMock.mockResolvedValue(createSession(currentUserId));

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        namaMataKuliah: "Algo",
        kelas: "RA",
        periode: "ganjil",
      }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(403);
  });

  it("GET lists courses for dosen", async () => {
    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/api/courses") as any, undefined as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].studentCount).toBe(3);
    expect(json.data[0].dosen.id).toBe("u1");
    expect(getCoursesForDosenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "u1",
      }),
    );
  });

  it("GET denies non-dosen", async () => {
    currentUserId = "u2";
    authGetSessionMock.mockResolvedValue(createSession(currentUserId));

    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/api/courses") as any, undefined as any);
    expect(res.status).toBe(403);
  });

  it("GET denies teachers who have not completed onboarding", async () => {
    currentUserId = "u3";
    authGetSessionMock.mockResolvedValue(createSession(currentUserId));

    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/api/courses") as any, undefined as any);
    expect(res.status).toBe(403);
  });
});
