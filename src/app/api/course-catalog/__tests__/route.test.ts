import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Prisma } from '@/generated/prisma/client';

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
    role: 'dosen',
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
    role: 'mahasiswa',
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

mock.module('@/lib/data/course-catalog', () => ({
  getCourseCatalog: getCourseCatalogMock,
  createCourseCatalogEntry: createCourseCatalogEntryMock,
}));

mock.module('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: mock(async ({ where }: any) => usersById[where.id] ?? null),
    },
  },
}));

function mockAuthForUser(userId: 'd1' | 'm1') {
  mock.module('@/lib/auth', () => ({
    auth: {
      api: {
        getSession: async () => createSession(userId),
      },
    },
  }));
}

describe('course catalog API', () => {
  beforeEach(() => {
    getCourseCatalogMock.mockClear();
    createCourseCatalogEntryMock.mockClear();
    mockAuthForUser('d1');
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
    mockAuthForUser('m1');
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/course-catalog') as any,
      undefined as any
    );
    expect(res.status).toBe(403);
    expect(getCourseCatalogMock).not.toHaveBeenCalled();
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
});
