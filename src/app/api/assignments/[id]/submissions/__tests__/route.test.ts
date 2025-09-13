import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: { findUnique: mock(async () => ({ id: 's1', role: 'mahasiswa', isOnboarded: true })) },
  assignment: {
    findUnique: mock(async (args: any) =>
      args?.where?.id === 'a1' ? { id: 'a1', courseId: 'c1' } : null
    ),
  },
  courseEnrollment: {
    findUnique: mock(async (args: any) =>
      args?.where?.courseId_studentId?.courseId === 'c1' && args?.where?.courseId_studentId?.studentId === 's1'
        ? { courseId: 'c1', studentId: 's1' }
        : null
    ),
  },
  assignmentSubmission: {
    upsert: mock(async () => ({})),
    deleteMany: mock(async () => ({ count: 2 })),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('assignment submissions API', () => {
  it('POST creates (upserts) submission for enrolled mahasiswa', async () => {
    mock.module('@/lib/auth', () => ({ auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } } }));
    const { POST } = await import('../route');
    const res = await POST(new Request('http://localhost/api/assignments/a1/submissions') as any, { params: Promise.resolve({ id: 'a1' }) } as any);
    expect(res.status).toBe(200);
    expect(prismaMock.assignmentSubmission.upsert).toHaveBeenCalled();
  });

  it('DELETE removes submissions by course or assignment', async () => {
    mock.module('@/lib/auth', () => ({ auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } } }));
    const { DELETE } = await import('../route');
    // by course (no query)
    const res1 = await DELETE(new Request('http://localhost/api/assignments/a1/submissions') as any, { params: Promise.resolve({ id: 'a1' }) } as any);
    expect(res1.status).toBe(200);
    // with assignmentId query
    const res2 = await DELETE(new Request('http://localhost/api/assignments/a1/submissions?assignmentId=a1') as any, { params: Promise.resolve({ id: 'a1' }) } as any);
    expect(res2.status).toBe(200);
  });
});

