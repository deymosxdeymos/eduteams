import { describe, expect, it, mock } from 'bun:test';

// Use the global mocks from preload, but ensure they work for this test
mock.module('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => ({
        user: { id: 'u1' },
        session: {
          id: 's1',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          token: 'test-token',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'u1',
        },
      }),
    },
  },
}));

mock.module('@/lib/prisma', () => ({
  default: {
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
            nim: null,
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
            name: 'Mahasiswa',
            email: 'student@example.com',
            role: 'mahasiswa',
            isOnboarded: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            nim: '12345',
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
        return null;
      }),
    },
    course: {
      create: mock(async (args: any) => ({
        id: 'c1',
        ...args.data,
        dosenId: args.data.dosenId || 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
        shareToken: null,
        dosen: { id: 'u1', name: 'Test User', email: 'test@example.com' },
      })),
      findFirst: mock(async () => null), // No duplicate courses found
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
    },
  },
}));

describe('courses API', () => {
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
  });

  it('POST denies non-dosen', async () => {
    // Override auth to return mahasiswa session
    mock.module('@/lib/auth', () => ({
      auth: {
        api: {
          getSession: async () => ({
            user: { id: 'u2' },
            session: {
              id: 's2',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              token: 'test-token',
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: 'u2',
            },
          }),
        },
      },
    }));

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
    // Ensure auth returns dosen session (reset after previous test override)
    mock.module('@/lib/auth', () => ({
      auth: {
        api: {
          getSession: async () => ({
            user: { id: 'u1' },
            session: {
              id: 's1',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              token: 'test-token',
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: 'u1',
            },
          }),
        },
      },
    }));
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
  });

  it('GET denies non-dosen', async () => {
    // Override auth to return mahasiswa session
    mock.module('@/lib/auth', () => ({
      auth: {
        api: {
          getSession: async () => ({
            user: { id: 'u2' },
            session: {
              id: 's2',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              token: 'test-token',
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: 'u2',
            },
          }),
        },
      },
    }));

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses') as any,
      undefined as any
    );
    expect(res.status).toBe(403);
  });
});
