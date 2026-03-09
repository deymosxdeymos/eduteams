import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { Prisma } from '@/generated/prisma/client';

const actualAuth = await import('@/lib/auth');
const actualCourseCatalog = await import('@/lib/data/course-catalog');
const actualPrisma = await import('@/lib/prisma');

const createSession = (userId: string) => ({
  user: { id: userId },
  session: {
    id: `session-${userId}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    token: `token-${userId}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
  },
});

const usersById: Record<string, any> = {
  d1: {
    id: 'd1',
    name: 'Dosen',
    email: 'dosen@example.com',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'TEACHER',
    nim: null,
    gender: null,
    isOnboarded: true,
    hasSeenWelcomeSplash: true,
    onboardingStep: null,
    onboardingData: null,
    mbtiType: null,
    ei: 0,
    sn: 0,
    tf: 0,
    pj: 0,
  },
  demo1: {
    id: 'demo1',
    name: 'Demo Dosen',
    email: 'demo.teacher.visitor1234@eduteams.local',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'TEACHER',
    nim: null,
    gender: null,
    isOnboarded: true,
    hasSeenWelcomeSplash: true,
    onboardingStep: null,
    onboardingData: null,
    mbtiType: null,
    ei: 0,
    sn: 0,
    tf: 0,
    pj: 0,
  },
  m1: {
    id: 'm1',
    name: 'Mahasiswa',
    email: 'student@example.com',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'STUDENT',
    nim: '123',
    gender: null,
    isOnboarded: true,
    hasSeenWelcomeSplash: true,
    onboardingStep: null,
    onboardingData: null,
    mbtiType: null,
    ei: 0,
    sn: 0,
    tf: 0,
    pj: 0,
  },
};

let currentUserId: 'd1' | 'demo1' | 'm1' = 'd1';

const getCourseCatalogMock = mock(async () => [
  {
    id: 'course_IF25_11001',
    code: 'IF25-11001',
    name: 'Algoritma dan Pemrograman',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

const createCourseCatalogEntryMock = mock(
  async (input: { code: string; name: string }) => ({
    id: 'custom-entry',
    code: input.code,
    name: input.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
);

const prismaUserFindUniqueMock = mock(
  async ({ where }: any) => usersById[where.id] ?? null
);
const authGetSessionMock = mock(async () => createSession(currentUserId));

function applyModuleMocks() {
  mock.module('@/lib/data/course-catalog', () => ({
    getCourseCatalog: getCourseCatalogMock,
    createCourseCatalogEntry: createCourseCatalogEntryMock,
  }));

  mock.module('@/lib/prisma', () => ({
    default: {
      user: {
        findUnique: prismaUserFindUniqueMock,
      },
    },
  }));

  mock.module('@/lib/auth', () => ({
    auth: {
      api: {
        getSession: authGetSessionMock,
      },
    },
  }));
}

function restoreModuleMocks() {
  mock.module('@/lib/data/course-catalog', () => actualCourseCatalog);
  mock.module('@/lib/prisma', () => ({ default: actualPrisma.default }));
  mock.module('@/lib/auth', () => ({ ...actualAuth }));
}

describe('course catalog API', () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    currentUserId = 'd1';
    delete process.env.DEMO_MODE;

    getCourseCatalogMock.mockClear();
    createCourseCatalogEntryMock.mockClear();
    prismaUserFindUniqueMock.mockClear();
    authGetSessionMock.mockClear();

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it('GET returns catalog entries for dosen', async () => {
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/course-catalog') as any,
      undefined as any
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].code).toBe('IF25-11001');
    expect(getCourseCatalogMock).toHaveBeenCalledWith({ search: undefined });
  });

  it('GET denies mahasiswa role', async () => {
    currentUserId = 'm1';
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/course-catalog') as any,
      undefined as any
    );
    expect(res.status).toBe(403);
    expect(getCourseCatalogMock).not.toHaveBeenCalled();
  });

  it('GET keeps real catalog behavior for non-demo teachers in demo mode', async () => {
    process.env.DEMO_MODE = '1';

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/course-catalog') as any,
      undefined as any
    );

    expect(res.status).toBe(200);
    expect(getCourseCatalogMock).toHaveBeenCalledWith({ search: undefined });
    const json = await res.json();
    expect(json.data[0].code).toBe('IF25-11001');
  });

  it('GET returns demo catalog only for demo teachers', async () => {
    process.env.DEMO_MODE = '1';
    currentUserId = 'demo1';

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/course-catalog') as any,
      undefined as any
    );

    expect(res.status).toBe(200);
    expect(getCourseCatalogMock).not.toHaveBeenCalled();
    const json = await res.json();
    expect(json.data).toEqual([
      { id: 'demo-1', code: 'IF3270', name: 'Machine Learning' },
      { id: 'demo-2', code: 'IF3250', name: 'Software Engineering' },
      { id: 'demo-3', code: 'IF3210', name: 'Mobile Development' },
    ]);
  });

  it('POST creates catalog entry for dosen', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/course-catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'if25-99999', name: 'Custom Course' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    expect(createCourseCatalogEntryMock).toHaveBeenCalledWith({
      code: 'IF25-99999',
      name: 'Custom Course',
    });
    const json = await res.json();
    expect(json.data.code).toBe('IF25-99999');
  });

  it('POST still creates real catalog entries for non-demo teachers in demo mode', async () => {
    process.env.DEMO_MODE = '1';

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/course-catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'if25-99999', name: 'Custom Course' }),
    });
    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(200);
    expect(createCourseCatalogEntryMock).toHaveBeenCalledWith({
      code: 'IF25-99999',
      name: 'Custom Course',
    });
  });

  it('POST blocks demo teachers from writing catalog entries', async () => {
    process.env.DEMO_MODE = '1';
    currentUserId = 'demo1';

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/course-catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'if25-99999', name: 'Custom Course' }),
    });
    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(403);
    expect(createCourseCatalogEntryMock).not.toHaveBeenCalled();
  });

  it('POST handles duplicate code error', async () => {
    createCourseCatalogEntryMock.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '6.18.0',
      })
    );
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/course-catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'IF25-11001', name: 'New Course' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(409);
  });

  it('POST preserves server errors as 500 responses', async () => {
    createCourseCatalogEntryMock.mockRejectedValueOnce(new Error('db offline'));

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/course-catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'IF25-11001', name: 'New Course' }),
    });
    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Internal server error');
  });
});
