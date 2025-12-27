import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 's1',
      role: 'STUDENT',
      isOnboarded: true,
    })),
  },
  courseEnrollment: {
    findMany: mock(async () => [
      {
        enrolledAt: new Date('2025-02-01T00:00:00Z'),
        course: {
          id: 'c1',
          namaMataKuliah: 'Algoritma',
          kelas: 'RA',
          tahunAwalPeriode: 2025,
          tahunAkhirPeriode: 2025,
          periode: 'ganjil',
          dosen: { name: 'Dosen' },
          _count: { enrollments: 3 },
        },
      },
    ]),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('GET /api/student/classes', () => {
  it('returns enrolled classes for mahasiswa', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/student/classes') as any,
      undefined as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].studentCount).toBe(3);
  });
});
