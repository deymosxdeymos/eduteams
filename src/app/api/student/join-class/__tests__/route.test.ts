import { describe, expect, it, mock } from 'bun:test';

mock.module('next/cache', () => ({ revalidateTag: () => {} }));
mock.module('@/lib/csrf', () => ({ isSameOrigin: () => true }));

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 's1',
      role: 'mahasiswa',
      isOnboarded: true,
    })),
  },
  course: {
    findUnique: mock(async (args: any) =>
      args?.where?.shareToken === 'token123'
        ? {
            id: 'c1',
            namaMataKuliah: 'Algoritma',
            kelas: 'RA',
            tahunAwalPeriode: 2025,
            tahunAkhirPeriode: 2025,
            dosenId: 'u1',
            dosen: { name: 'Dosen' },
          }
        : null
    ),
    update: mock(async () => ({})),
  },
  courseEnrollment: {
    findUnique: mock(async () => null),
    create: mock(async () => ({})),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('POST /api/student/join-class', () => {
  it('joins class with valid token', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/student/join-class', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-host': 'localhost',
      },
      body: JSON.stringify({ token: 'token123' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.courseEnrollment.create).toHaveBeenCalled();
  });

  it('rejects invalid token', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/student/join-class', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-host': 'localhost',
      },
      body: JSON.stringify({ token: 'bad' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(404);
  });
});
