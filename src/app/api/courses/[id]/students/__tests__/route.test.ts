import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 'u1',
      role: 'dosen',
      isOnboarded: true,
    })),
  },
  course: {
    findUnique: mock(async (args: any) =>
      args?.where?.id === 'c1' && args?.where?.dosenId === 'u1'
        ? { id: 'c1' }
        : null
    ),
  },
  courseEnrollment: {
    findUnique: mock(async () => ({ courseId: 'c1', studentId: 's1' })),
    findMany: mock(async () => [
      {
        enrolledAt: new Date('2025-01-10T00:00:00Z'),
        student: {
          id: 's1',
          name: 'S',
          email: 's@example.com',
          nimNpm: 'N',
          mbtiType: 'INTJ',
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
        },
      },
    ]),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('GET /api/courses/[id]/students', () => {
  it('dosen gets students for own course', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/c1/students') as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].id).toBe('s1');
  });
});
