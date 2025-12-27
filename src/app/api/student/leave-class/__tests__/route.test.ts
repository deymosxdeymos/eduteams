import { describe, expect, it, mock } from 'bun:test';

mock.module('next/cache', () => ({ revalidateTag: () => {} }));
mock.module('@/lib/csrf', () => ({ isSameOrigin: () => true }));

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 's1',
      role: 'STUDENT',
      isOnboarded: true,
    })),
  },
  courseEnrollment: {
    findUnique: mock(async (args: any) =>
      args?.where?.courseId_studentId?.courseId === 'c1'
        ? {
            courseId: 'c1',
            studentId: 's1',
            course: {
              id: 'c1',
              namaMataKuliah: 'Algoritma',
              kelas: 'RA',
              dosenId: 'u1',
            },
          }
        : null
    ),
    delete: mock(async () => ({})),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('POST /api/student/leave-class', () => {
  it('leaves class when enrolled', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/student/leave-class', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-host': 'localhost',
      },
      body: JSON.stringify({ courseId: 'c1' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.courseEnrollment.delete).toHaveBeenCalled();
  });

  it('returns 404 when not enrolled', async () => {
    prismaMock.courseEnrollment.findUnique.mockImplementationOnce(
      async () => null
    );
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/student/leave-class', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-host': 'localhost',
      },
      body: JSON.stringify({ courseId: 'cX' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(404);
  });
});
