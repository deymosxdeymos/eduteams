import { mock } from 'bun:test';

// Mock Prisma with a comprehensive implementation that handles all test scenarios
const prismaMock: any = {
  user: {
    findUnique: mock(async ({ where }: any) => {
      if (where.id === 'u1')
        return {
          id: 'u1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'dosen',
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nimNpm: null,
          gender: 'laki-laki',
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          mbtiType: null,
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
        };
      if (where.id === 'u2')
        return {
          id: 'u2',
          name: 'Test User 2',
          email: 'test2@example.com',
          role: 'mahasiswa',
          isOnboarded: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          nimNpm: '12345',
          gender: 'perempuan',
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          mbtiType: null,
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
        };
      if (where.id === 's1')
        return {
          id: 's1',
          name: 'Test Student',
          email: 'student@example.com',
          role: 'mahasiswa',
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nimNpm: '67890',
          gender: 'laki-laki',
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          mbtiType: null,
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
        };
      if (where.id === 'a1')
        return {
          id: 'a1',
          name: 'Test Admin',
          email: 'admin@example.com',
          role: 'admin',
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          nimNpm: null,
          gender: 'laki-laki',
          hasSeenWelcomeSplash: false,
          onboardingStep: null,
          onboardingData: null,
          mbtiType: null,
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
        };
      return null;
    }),
    create: mock(async (args: any) => ({
      id: 'new-user',
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    update: mock(async (args: any) => ({
      id: args.where.id,
      ...args.data,
      updatedAt: new Date(),
    })),
  },
  course: {
    create: mock(async (args: any) => ({
      id: 'c1',
      ...args.data,
      dosenId: args.data.dosenId || 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
      shareToken: null,
    })),
    findMany: mock(async () => [
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
        dosen: { id: 'u1', name: 'Test User', email: 'test@example.com' },
        _count: { enrollments: 3 },
      },
    ]),
    findUnique: mock(async ({ where }: any) => {
      if (where.id === 'c1')
        return {
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
          dosen: { id: 'u1', name: 'Test User', email: 'test@example.com' },
        };
      return null;
    }),
    update: mock(async (args: any) => ({
      id: args.where.id,
      ...args.data,
      updatedAt: new Date(),
    })),
  },
  courseEnrollment: {
    create: mock(async (args: any) => ({
      id: 'e1',
      ...args.data,
      createdAt: new Date(),
    })),
    findMany: mock(async () => []),
    findUnique: mock(async () => null),
    delete: mock(async () => ({ id: 'e1' })),
  },
  assignment: {
    create: mock(async (args: any) => ({
      id: 'a1',
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    findMany: mock(async () => []),
    findUnique: mock(async ({ where }: any) => {
      if (where.id === 'a1')
        return {
          id: 'a1',
          title: 'Test Assignment',
          description: 'Test description',
          courseId: 'c1',
          skills: ['skill1'],
          topics: ['topic1'],
          createdAt: new Date(),
          updatedAt: new Date(),
          course: { dosenId: 'u1' },
        };
      return null;
    }),
    update: mock(async (args: any) => ({
      id: args.where.id,
      ...args.data,
      updatedAt: new Date(),
    })),
  },
  assignmentSubmission: {
    create: mock(async (args: any) => ({
      id: 'sub1',
      ...args.data,
      createdAt: new Date(),
    })),
    findMany: mock(async () => []),
    findUnique: mock(async () => null),
    upsert: mock(async (args: any) => ({
      id: 'sub1',
      ...args.create,
      createdAt: new Date(),
    })),
    delete: mock(async () => ({ id: 'sub1' })),
  },
};

// Mock auth with proper session structure
const authMock = {
  api: {
    getSession: mock(async () => ({
      user: { id: 'u1' },
      session: {
        id: 's1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        token: 'test-token',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'u1',
      },
    })),
  },
};

// Apply the mocks
mock.module('@/lib/prisma', () => ({ default: prismaMock }));
mock.module('@/lib/auth', () => ({ auth: authMock }));

// Mock other modules that might be needed
mock.module('next/headers', () => ({
  headers: () => new Map([['authorization', 'Bearer test-token']]),
  cookies: () => ({
    get: () => ({ value: 'test-session' }),
    set: () => {},
  }),
}));

mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mock(() => {}),
    refresh: mock(() => {}),
    back: mock(() => {}),
  }),
  usePathname: () => '/',
}));

mock.module('@/lib/logger', () => ({
  logger: {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
  },
}));
