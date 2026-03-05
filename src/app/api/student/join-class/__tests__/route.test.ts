import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 's1',
      role: 'STUDENT',
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

function applyModuleMocks() {
  mock.module('next/cache', () => ({ revalidateTag: () => {} }));
  mock.module('@/lib/csrf', () => ({ isSameOrigin: () => true }));
  mock.module('@/lib/prisma', () => ({ default: prismaMock }));
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  applyModuleMocks();
});

afterEach(() => {
  mock.restore();

  if (originalAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
    return;
  }

  process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
});

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
        origin: 'http://localhost:3000',
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
        origin: 'http://localhost:3000',
        'x-forwarded-host': 'localhost',
      },
      body: JSON.stringify({ token: 'bad' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(404);
  });
});
