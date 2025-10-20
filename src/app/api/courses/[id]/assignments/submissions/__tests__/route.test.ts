import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 's1',
      role: 'mahasiswa',
      isOnboarded: true,
    })),
  },
  courseEnrollment: {
    findUnique: mock(async () => ({ courseId: 'c1', studentId: 's1' })),
  },
  assignment: {
    findFirst: mock(async (args: any) =>
      args?.where?.id === 'a1' && args?.where?.courseId === 'c1'
        ? { id: 'a1' }
        : null
    ),
  },
  assignmentSubmission: { deleteMany: mock(async () => ({ count: 3 })) },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('DELETE /api/courses/[id]/assignments/submissions', () => {
  it('deletes submissions by course and by assignmentId for enrolled mahasiswa', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { DELETE } = await import('../route');
    // by course
    const res1 = await DELETE(
      new Request(
        'http://localhost/api/courses/c1/assignments/submissions'
      ) as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res1.status).toBe(200);
    // by assignmentId query
    const res2 = await DELETE(
      new Request(
        'http://localhost/api/courses/c1/assignments/submissions?assignmentId=a1'
      ) as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res2.status).toBe(200);
  });
});
