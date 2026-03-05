import { describe, expect, it, mock } from 'bun:test';

const actualAuth = await import('@/lib/auth');

let sessionUserId = 'u1';

const prismaMock: any = {
  user: {
    findUnique: mock(async (args: any) => ({
      id: args?.where?.id ?? sessionUserId,
      role: (args?.where?.id ?? sessionUserId) === 'u1' ? 'TEACHER' : 'STUDENT',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: false,
      image: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
      nim: 'NIM-1',
      gender: null,
      isOnboarded: true,
      hasSeenWelcomeSplash: false,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: {
        mbtiType: 'INTJ',
        ei: 0,
        sn: 0,
        tf: 0,
        pj: 0,
        personalityData: null,
      },
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
          name: 'Student One',
          email: 's1@example.com',
          nim: 'NIM-1',
          personalityProfile: {
            mbtiType: 'INTJ',
            ei: 0,
            sn: 0,
            tf: 0,
            pj: 0,
          },
        },
      },
      {
        enrolledAt: new Date('2025-01-11T00:00:00Z'),
        student: {
          id: 's2',
          name: 'Student Two',
          email: 's2@example.com',
          nim: 'NIM-2',
          personalityProfile: {
            mbtiType: 'ENFP',
            ei: 10,
            sn: 20,
            tf: 30,
            pj: 40,
          },
        },
      },
    ]),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));
mock.module('@/lib/auth', () => ({
  ...actualAuth,
  auth: { api: { getSession: async () => ({ user: { id: sessionUserId } }) } },
}));

describe('GET /api/courses/[id]/students', () => {
  it('dosen gets students for own course', async () => {
    sessionUserId = 'u1';
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

  it('student only receives sensitive fields for their own record', async () => {
    sessionUserId = 's1';
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/c1/students') as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data[0].email).toBe('s1@example.com');
    expect(json.data[0].mbtiType).toBe('INTJ');
    expect(json.data[1].email).toBe('N/A');
    expect(json.data[1].mbtiType).toBeNull();
    expect(json.data[1].ei).toBeNull();
  });
});
