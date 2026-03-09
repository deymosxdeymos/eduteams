import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

const actualAuth = await import('@/lib/auth');
const actualDashboardCourses = await import('@/lib/dashboard/courses');
const actualPrisma = await import('@/lib/prisma');

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

let currentUserId: 'u1' | 'u2' | 'demo-teacher' = 'u1';

const courseCreateMock = mock(async (args: any) => ({
  id: 'c1',
  ...args.data,
  dosenId: args.data.dosenId || 'u1',
  createdAt: new Date(),
  updatedAt: new Date(),
  shareToken: null,
  dosen: { id: 'u1', name: 'Test User', email: 'test@example.com' },
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
  })
);
const authGetSessionMock = mock(async () => createSession(currentUserId));
const getCoursesForDosenMock = mock(async () => [
  {
    id: 'c1',
    namaMataKuliah: 'Test Course',
    kelas: 'A',
    tahunAwalPeriode: 2025,
    tahunAkhirPeriode: 2025,
    periode: 'ganjil',
    dosenId: 'u1',
    shareToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    studentCount: 3,
    dosen: { id: 'u1', name: 'Test User', email: 'test@example.com' },
  },
]);

const prismaMock = {
  $transaction: transactionMock,
  user: {
    findUnique: mock(async ({ where }: any) => {
      if (where.id === 'u1') {
        return {
          id: 'u1',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          role: 'TEACHER',
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: null,
          gender: 'MALE',
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.id === 'u2') {
        return {
          id: 'u2',
          name: 'Mahasiswa',
          email: 'student@example.com',
          emailVerified: true,
          image: null,
          role: 'STUDENT',
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: '12345',
          gender: 'FEMALE',
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.id === 'demo-teacher') {
        return {
          id: 'demo-teacher',
          name: 'Demo Teacher',
          email: 'demo.teacher.visitor1234@eduteams.local',
          emailVerified: true,
          image: null,
          role: 'TEACHER',
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: null,
          gender: 'FEMALE',
          hasSeenWelcomeSplash: true,
          onboardingStep: null,
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
  mock.module('@/lib/auth', () => ({
    auth: {
      api: {
        getSession: authGetSessionMock,
      },
    },
  }));

  mock.module('@/lib/prisma', () => ({
    default: prismaMock,
  }));

  mock.module('@/lib/dashboard/courses', () => ({
    getCoursesForDosen: getCoursesForDosenMock,
  }));
}

function restoreModuleMocks() {
  mock.module('@/lib/auth', () => ({ ...actualAuth }));
  mock.module('@/lib/prisma', () => ({ default: actualPrisma.default }));
  mock.module('@/lib/dashboard/courses', () => actualDashboardCourses);
}

describe('courses API', () => {
  beforeEach(() => {
    currentUserId = 'u1';
    delete process.env.DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_MODE;

    authGetSessionMock.mockReset();
    courseCreateMock.mockReset();
    seedUsersCreateManyMock.mockReset();
    seedProfilesCreateManyMock.mockReset();
    seedEnrollmentsCreateManyMock.mockReset();
    transactionMock.mockReset();
    getCoursesForDosenMock.mockReset();
    prismaMock.user.findUnique.mockReset();
    prismaMock.course.findFirst.mockReset();

    authGetSessionMock.mockResolvedValue(createSession(currentUserId));
    courseCreateMock.mockImplementation(async (args: any) => ({
      id: 'c1',
      ...args.data,
      dosenId: args.data.dosenId || 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
      shareToken: null,
      dosen: { id: 'u1', name: 'Test User', email: 'test@example.com' },
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
      })
    );
    getCoursesForDosenMock.mockResolvedValue([
      {
        id: 'c1',
        namaMataKuliah: 'Test Course',
        kelas: 'A',
        tahunAwalPeriode: 2025,
        tahunAkhirPeriode: 2025,
        periode: 'ganjil',
        dosenId: 'u1',
        shareToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentCount: 3,
        dosen: { id: 'u1', name: 'Test User', email: 'test@example.com' },
      },
    ]);
    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.id === 'u1') {
        return {
          id: 'u1',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          role: 'TEACHER',
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: null,
          gender: 'MALE',
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.id === 'u2') {
        return {
          id: 'u2',
          name: 'Mahasiswa',
          email: 'student@example.com',
          emailVerified: true,
          image: null,
          role: 'STUDENT',
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: '12345',
          gender: 'FEMALE',
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.id === 'demo-teacher') {
        return {
          id: 'demo-teacher',
          name: 'Demo Teacher',
          email: 'demo.teacher.visitor1234@eduteams.local',
          emailVerified: true,
          image: null,
          role: 'TEACHER',
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: null,
          gender: 'FEMALE',
          hasSeenWelcomeSplash: true,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.email === 'demo.student.visitor1234@eduteams.local') {
        return null;
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

  it('POST creates course for dosen', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/courses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        namaMataKuliah: 'Algoritma',
        kelas: 'RA',
        periode: 'ganjil',
      }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.namaMataKuliah).toBe('Algoritma');
    expect(courseCreateMock).toHaveBeenCalled();
    expect(seedUsersCreateManyMock).not.toHaveBeenCalled();
  });

  it('does not seed demo students for non-demo teachers when demo mode is enabled', async () => {
    process.env.DEMO_MODE = '1';
    process.env.NEXT_PUBLIC_DEMO_MODE = '1';

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/courses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        namaMataKuliah: 'Algoritma',
        kelas: 'RB',
        periode: 'ganjil',
      }),
    });
    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(200);
    expect(seedUsersCreateManyMock).not.toHaveBeenCalled();
    expect(seedProfilesCreateManyMock).not.toHaveBeenCalled();
    expect(seedEnrollmentsCreateManyMock).not.toHaveBeenCalled();
  });

  it('seeds demo students for demo teachers when demo mode is enabled', async () => {
    process.env.DEMO_MODE = '1';
    process.env.NEXT_PUBLIC_DEMO_MODE = '1';
    currentUserId = 'demo-teacher';
    authGetSessionMock.mockResolvedValue(createSession(currentUserId));

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/courses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        namaMataKuliah: 'Algoritma',
        kelas: 'RC',
        periode: 'ganjil',
      }),
    });
    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(200);
    expect(seedUsersCreateManyMock).toHaveBeenCalled();
    expect(seedProfilesCreateManyMock).toHaveBeenCalled();
    expect(seedEnrollmentsCreateManyMock).toHaveBeenCalled();
  });

  it('enrolls an existing paired demo student into newly created demo courses', async () => {
    process.env.DEMO_MODE = '1';
    process.env.NEXT_PUBLIC_DEMO_MODE = '1';
    currentUserId = 'demo-teacher';
    authGetSessionMock.mockResolvedValue(createSession(currentUserId));
    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.id === 'demo-teacher') {
        return {
          id: 'demo-teacher',
          name: 'Demo Teacher',
          email: 'demo.teacher.visitor1234@eduteams.local',
          emailVerified: true,
          image: null,
          role: 'TEACHER',
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nim: null,
          gender: 'FEMALE',
          hasSeenWelcomeSplash: true,
          onboardingStep: null,
          onboardingData: null,
          personalityProfile: null,
        };
      }

      if (where.email === 'demo.student.visitor1234@eduteams.local') {
        return { id: 'demo-student' };
      }

      return null;
    });
    seedEnrollmentsCreateManyMock
      .mockResolvedValueOnce({ count: 24 })
      .mockResolvedValueOnce({ count: 1 });

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/courses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        namaMataKuliah: 'Algoritma',
        kelas: 'RD',
        periode: 'ganjil',
      }),
    });
    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(200);
    expect(seedEnrollmentsCreateManyMock).toHaveBeenCalledTimes(2);
    expect(seedEnrollmentsCreateManyMock.mock.calls[1]?.[0]).toEqual({
      data: [
        {
          courseId: 'c1',
          studentId: 'demo-student',
          enrolledAt: expect.any(Date),
        },
      ],
      skipDuplicates: true,
    });
  });

  it('POST denies non-dosen', async () => {
    currentUserId = 'u2';
    authGetSessionMock.mockResolvedValue(createSession(currentUserId));

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/courses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        namaMataKuliah: 'Algo',
        kelas: 'RA',
        tahunAwalPeriode: 2025,
        tahunAkhirPeriode: 2025,
        periode: 'ganjil',
      }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(403);
  });

  it('GET lists courses for dosen', async () => {
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses') as any,
      undefined as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].studentCount).toBe(3);
    expect(json.data[0].dosen.id).toBe('u1');
    expect(getCoursesForDosenMock).toHaveBeenCalledWith('u1');
  });

  it('GET denies non-dosen', async () => {
    currentUserId = 'u2';
    authGetSessionMock.mockResolvedValue(createSession(currentUserId));

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses') as any,
      undefined as any
    );
    expect(res.status).toBe(403);
  });
});
