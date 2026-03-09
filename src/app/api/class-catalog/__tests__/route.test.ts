import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { Prisma } from '@/generated/prisma/client';

const actualAuth = await import('@/lib/auth');
const actualClassCatalog = await import('@/lib/data/class-catalog');
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

const getClassCatalogMock = mock(async () => [
  {
    id: 'class_K01',
    code: 'K01',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

const createClassCatalogEntryMock = mock(async (input: { code: string }) => ({
  id: 'custom-entry',
  code: input.code,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const prismaUserFindUniqueMock = mock(
  async ({ where }: any) => usersById[where.id] ?? null
);
const authGetSessionMock = mock(async () => createSession(currentUserId));

function applyModuleMocks() {
  mock.module('@/lib/data/class-catalog', () => ({
    getClassCatalog: getClassCatalogMock,
    createClassCatalogEntry: createClassCatalogEntryMock,
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
  mock.module('@/lib/data/class-catalog', () => actualClassCatalog);
  mock.module('@/lib/prisma', () => ({ default: actualPrisma.default }));
  mock.module('@/lib/auth', () => ({ ...actualAuth }));
}

describe('class catalog API', () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    currentUserId = 'd1';
    delete process.env.DEMO_MODE;

    getClassCatalogMock.mockClear();
    createClassCatalogEntryMock.mockClear();
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
      new Request('http://localhost/api/class-catalog') as any,
      undefined as any
    );

    expect(res.status).toBe(200);
    expect(getClassCatalogMock).toHaveBeenCalledWith({ search: undefined });
    const json = await res.json();
    expect(json.data[0].code).toBe('K01');
  });

  it('GET denies mahasiswa role', async () => {
    currentUserId = 'm1';

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/class-catalog') as any,
      undefined as any
    );

    expect(res.status).toBe(403);
    expect(getClassCatalogMock).not.toHaveBeenCalled();
  });

  it('GET keeps real catalog behavior for non-demo teachers in demo mode', async () => {
    process.env.DEMO_MODE = '1';

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/class-catalog') as any,
      undefined as any
    );

    expect(res.status).toBe(200);
    expect(getClassCatalogMock).toHaveBeenCalledWith({ search: undefined });
    const json = await res.json();
    expect(json.data[0].code).toBe('K01');
  });

  it('GET returns demo catalog only for demo teachers', async () => {
    process.env.DEMO_MODE = '1';
    currentUserId = 'demo1';

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/class-catalog') as any,
      undefined as any
    );

    expect(res.status).toBe(200);
    expect(getClassCatalogMock).not.toHaveBeenCalled();
    const json = await res.json();
    expect(json.data).toEqual([
      { id: 'demo-a', code: 'K01' },
      { id: 'demo-b', code: 'K02' },
    ]);
  });

  it('POST creates catalog entry for dosen', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/class-catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'k99' }),
    });
    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(200);
    expect(createClassCatalogEntryMock).toHaveBeenCalledWith({
      code: 'K99',
    });
    const json = await res.json();
    expect(json.data.code).toBe('K99');
  });

  it('POST still creates real catalog entries for non-demo teachers in demo mode', async () => {
    process.env.DEMO_MODE = '1';

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/class-catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'k99' }),
    });
    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(200);
    expect(createClassCatalogEntryMock).toHaveBeenCalledWith({
      code: 'K99',
    });
  });

  it('POST blocks demo teachers from writing catalog entries', async () => {
    process.env.DEMO_MODE = '1';
    currentUserId = 'demo1';

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/class-catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'k99' }),
    });
    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(403);
    expect(createClassCatalogEntryMock).not.toHaveBeenCalled();
  });

  it('POST handles duplicate code error', async () => {
    createClassCatalogEntryMock.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '6.18.0',
      })
    );

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/class-catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'K01' }),
    });
    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(409);
  });

  it('POST preserves server errors as 500 responses', async () => {
    createClassCatalogEntryMock.mockRejectedValueOnce(new Error('db offline'));

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/class-catalog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'K01' }),
    });
    const res = await POST(req as any, undefined as any);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Internal server error');
  });
});
