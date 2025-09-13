import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  course: {
    create: mock(async (args: any) => ({ id: 'c1', ...args.data, dosen: args.include.dosen ? { id: 'u1', name: 'Dosen', email: 'dosen@example.com' } : undefined })),
    findMany: mock(async () => [
      {
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
        _count: { enrollments: 3 },
      },
    ]),
  },
  user: {
    findUnique: mock(async () => ({ id: 'u1', role: 'dosen', isOnboarded: true })),
  },
};

mock.module('@/lib/auth', () => ({
  auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
}));

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('courses API', () => {
  it('POST creates course for dosen', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/courses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        namaMataKuliah: 'Algoritma',
        kelas: 'RA',
        tahunAwalPeriode: 2025,
        tahunAkhirPeriode: 2025,
        periode: 'ganjil',
      }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(prismaMock.course.create).toHaveBeenCalled();
  });

  it('POST denies non-dosen', async () => {
    // change user role to mahasiswa
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({ id: 'u1', role: 'mahasiswa', isOnboarded: true }));
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
    const res = await GET(new Request('http://localhost/api/courses') as any, undefined as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].studentCount).toBe(3);
    expect(json.data[0].dosen.id).toBe('u1');
  });

  it('GET denies non-dosen', async () => {
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({ id: 'u1', role: 'mahasiswa', isOnboarded: true }));
    const { GET } = await import('../route');
    const res = await GET(new Request('http://localhost/api/courses') as any, undefined as any);
    expect(res.status).toBe(403);
  });
});

