import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({ id: 'u1', role: 'dosen', isOnboarded: true })),
  },
  course: {
    findFirst: mock(async (args: any) =>
      args?.where?.dosenId === 'u1'
        ? {
            id: 'c1',
            namaMataKuliah: 'Algoritma',
            kelas: 'RA',
            tahunAwalPeriode: 2025,
            tahunAkhirPeriode: 2025,
            periode: 'ganjil',
            dosenId: 'u1',
            shareToken: null,
            createdAt: new Date('2025-01-01T00:00:00Z'),
            updatedAt: new Date('2025-01-02T00:00:00Z'),
            dosen: { id: 'u1', name: 'Dosen', email: 'dosen@example.com' },
          }
        : null
    ),
  },
  courseEnrollment: {
    findUnique: mock(async (args: any) =>
      args?.where?.courseId_studentId?.studentId === 's1'
        ? {
            course: {
              id: 'c1',
              namaMataKuliah: 'Algoritma',
              kelas: 'RA',
              tahunAwalPeriode: 2025,
              tahunAkhirPeriode: 2025,
              periode: 'ganjil',
              dosenId: 'u2',
              shareToken: null,
              createdAt: new Date('2025-01-01T00:00:00Z'),
              updatedAt: new Date('2025-01-02T00:00:00Z'),
              dosen: { id: 'u2', name: 'Other Dosen', email: 'other@example.com' },
            },
          }
        : null
    ),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('GET /api/courses/[id]', () => {
  it('dosen can get their own course', async () => {
    // Auth session: dosen u1
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/c1') as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.id).toBe('c1');
    expect(json.data.dosen.id).toBe('u1');
  });

  it('mahasiswa can get enrolled course', async () => {
    // Auth session: mahasiswa s1
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({ id: 's1', role: 'mahasiswa', isOnboarded: true }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/c1') as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.id).toBe('c1');
    expect(json.data.dosen.id).toBe('u2');
  });

  it('returns 403 if role lacks access', async () => {
    // Auth session: admin (not dosen/mahasiswa-onboarded path)
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({ id: 'a1', role: 'admin', isOnboarded: true }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'a1' } }) } },
    }));

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/cX') as any,
      { params: Promise.resolve({ id: 'cX' }) } as any
    );
    expect(res.status).toBe(403);
  });
});

