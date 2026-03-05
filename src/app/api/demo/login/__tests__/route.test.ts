import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { DASHBOARD_STATISTICS_TAG } from '@/lib/dashboard/statistics';

const actualApiI18n = await import('@/lib/api-i18n');
const actualAuth = await import('@/lib/auth');
const actualCsrf = await import('@/lib/csrf');
const actualDemoConfig = await import('@/lib/demo/config');
const actualNextCache = await import('next/cache');
const actualNextHeaders = await import('next/headers');
const actualPrisma = await import('@/lib/prisma');
const actualRateLimit = await import('@/lib/rate-limit');

const signInEmailMock = mock(async () => undefined);
const signUpEmailMock = mock(async () => ({ user: { id: 'demo-user' } }));
const cookieStoreDeleteMock = mock(() => undefined);
const nextCookiesMock = mock(async () => ({
  delete: cookieStoreDeleteMock,
}));
const nextHeadersMock = mock(async () => new Headers());
const revalidateTagMock = mock(() => undefined);
const isSameOriginMock = mock((request: { headers: Headers }) =>
  Boolean(request.headers.get('origin') || request.headers.get('referer'))
);
const checkRateLimitMock = mock(async () => ({
  allowed: true,
  retryAfterSeconds: 60,
}));
const getClientIdentifierMock = mock(() => '198.51.100.9');

const prismaMock = {
  user: {
    findUnique: mock(async () => null),
    delete: mock(async () => ({})),
    deleteMany: mock(async () => ({ count: 0 })),
    update: mock(async () => ({})),
  },
  course: {
    deleteMany: mock(async () => ({ count: 0 })),
    findMany: mock(async () => []),
  },
  courseEnrollment: {
    deleteMany: mock(async () => ({ count: 0 })),
    createMany: mock(async () => ({ count: 0 })),
  },
  personalitySession: {
    deleteMany: mock(async () => ({ count: 0 })),
  },
  personalityProfile: {
    deleteMany: mock(async () => ({ count: 0 })),
    upsert: mock(async () => ({})),
  },
  personSkill: {
    deleteMany: mock(async () => ({ count: 0 })),
  },
  studentCompetencyProfile: {
    deleteMany: mock(async () => ({ count: 0 })),
  },
  assignmentSubmission: {
    findMany: mock(async () => []),
    deleteMany: mock(async () => ({ count: 0 })),
  },
  assignmentTopicPreference: {
    deleteMany: mock(async () => ({ count: 0 })),
  },
  teamMember: {
    deleteMany: mock(async () => ({ count: 0 })),
  },
  teamFormationRequest: {
    deleteMany: mock(async () => ({ count: 0 })),
  },
  $transaction: mock(async (input: unknown) => {
    if (typeof input === 'function') {
      return input(prismaMock as any);
    }

    return [];
  }),
};

function applyModuleMocks() {
  mock.module('next/cache', () => ({
    ...actualNextCache,
    revalidateTag: revalidateTagMock,
  }));

  mock.module('next/headers', () => ({
    cookies: nextCookiesMock,
    headers: nextHeadersMock,
  }));

  mock.module('@/lib/api-i18n', () => ({
    getRequestLocale: () => 'id',
  }));

  mock.module('@/lib/auth', () => ({
    auth: {
      api: {
        signInEmail: signInEmailMock,
        signUpEmail: signUpEmailMock,
      },
    },
  }));

  mock.module('@/lib/prisma', () => ({
    default: prismaMock,
  }));

  mock.module('@/lib/demo/config', () => actualDemoConfig);

  mock.module('@/lib/csrf', () => ({
    isSameOrigin: isSameOriginMock,
  }));

  mock.module('@/lib/rate-limit', () => ({
    checkRateLimit: checkRateLimitMock,
    getClientIdentifier: getClientIdentifierMock,
  }));
}

function restoreModuleMocks() {
  mock.module('next/cache', () => actualNextCache);
  mock.module('next/headers', () => actualNextHeaders);
  mock.module('@/lib/api-i18n', () => actualApiI18n);
  mock.module('@/lib/auth', () => ({ ...actualAuth }));
  mock.module('@/lib/csrf', () => actualCsrf);
  mock.module('@/lib/demo/config', () => actualDemoConfig);
  mock.module('@/lib/prisma', () => ({ default: actualPrisma.default }));
  mock.module('@/lib/rate-limit', () => actualRateLimit);
}

function createRequest(
  cookieValue?: string,
  includeOrigin = true,
  role: 'TEACHER' | 'STUDENT' = 'TEACHER'
) {
  return {
    headers: new Headers({
      'content-type': 'application/json',
      ...(includeOrigin ? { origin: 'http://localhost:3000' } : {}),
    }),
    cookies: {
      get: (_name: string) =>
        cookieValue
          ? { name: 'eduteams-demo-visitor', value: cookieValue }
          : undefined,
    },
    text: async () => JSON.stringify({ role }),
  } as any;
}

const originalNodeEnv = process.env.NODE_ENV;
const originalDemoMode = process.env.DEMO_MODE;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalDevAllowedOrigins = process.env.DEV_ALLOWED_ORIGINS;

describe.serial('POST /api/demo/login', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.DEMO_MODE = '1';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    delete process.env.DEV_ALLOWED_ORIGINS;

    signInEmailMock.mockReset();
    signUpEmailMock.mockReset();
    cookieStoreDeleteMock.mockReset();
    nextCookiesMock.mockReset();
    nextHeadersMock.mockReset();
    revalidateTagMock.mockReset();
    isSameOriginMock.mockReset();
    checkRateLimitMock.mockReset();
    getClientIdentifierMock.mockReset();
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.delete.mockReset();
    prismaMock.user.deleteMany.mockReset();
    prismaMock.user.update.mockReset();
    prismaMock.course.deleteMany.mockReset();
    prismaMock.course.findMany.mockReset();
    prismaMock.courseEnrollment.deleteMany.mockReset();
    prismaMock.courseEnrollment.createMany.mockReset();
    prismaMock.personalitySession.deleteMany.mockReset();
    prismaMock.personalityProfile.deleteMany.mockReset();
    prismaMock.personalityProfile.upsert.mockReset();
    prismaMock.personSkill.deleteMany.mockReset();
    prismaMock.studentCompetencyProfile.deleteMany.mockReset();
    prismaMock.assignmentSubmission.findMany.mockReset();
    prismaMock.assignmentSubmission.deleteMany.mockReset();
    prismaMock.assignmentTopicPreference.deleteMany.mockReset();
    prismaMock.teamMember.deleteMany.mockReset();
    prismaMock.teamFormationRequest.deleteMany.mockReset();
    prismaMock.$transaction.mockReset();

    signInEmailMock.mockResolvedValue(undefined);
    signUpEmailMock.mockResolvedValue({ user: { id: 'demo-user' } });
    cookieStoreDeleteMock.mockImplementation(() => undefined);
    nextCookiesMock.mockResolvedValue({ delete: cookieStoreDeleteMock });
    nextHeadersMock.mockResolvedValue(new Headers());
    isSameOriginMock.mockImplementation((request: { headers: Headers }) =>
      Boolean(request.headers.get('origin') || request.headers.get('referer'))
    );
    checkRateLimitMock.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 60,
    });
    getClientIdentifierMock.mockReturnValue('198.51.100.9');
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.delete.mockResolvedValue({});
    prismaMock.user.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.course.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.course.findMany.mockResolvedValue([]);
    prismaMock.courseEnrollment.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.courseEnrollment.createMany.mockResolvedValue({ count: 0 });
    prismaMock.personalitySession.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.personalityProfile.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.personalityProfile.upsert.mockResolvedValue({});
    prismaMock.personSkill.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.studentCompetencyProfile.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.assignmentSubmission.findMany.mockResolvedValue([]);
    prismaMock.assignmentSubmission.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.assignmentTopicPreference.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.teamMember.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.teamFormationRequest.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.$transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === 'function') {
        return input(prismaMock as any);
      }

      return [];
    });

    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();
    process.env.NODE_ENV = originalNodeEnv;

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }

    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }

    if (originalDevAllowedOrigins === undefined) {
      delete process.env.DEV_ALLOWED_ORIGINS;
      return;
    }

    process.env.DEV_ALLOWED_ORIGINS = originalDevAllowedOrigins;
  });

  it('returns 404 when only the public demo flag is enabled', async () => {
    delete process.env.DEMO_MODE;
    process.env.NEXT_PUBLIC_DEMO_MODE = '1';

    try {
      const { POST } = await import('../route');
      const res = await POST(createRequest('visitor1234'));

      expect(res.status).toBe(404);
      expect(checkRateLimitMock).not.toHaveBeenCalled();
      expect(signInEmailMock).not.toHaveBeenCalled();
    } finally {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    }
  });

  it('fails closed in production when no trusted client identifier is available', async () => {
    process.env.NODE_ENV = 'production';
    getClientIdentifierMock.mockReturnValue(null);

    const { POST } = await import('../route');
    const res = await POST(createRequest('visitor1234'));

    expect(res.status).toBe(503);
    expect(checkRateLimitMock).not.toHaveBeenCalled();
    expect(signInEmailMock).not.toHaveBeenCalled();
  });

  it('falls back to the demo visitor key outside production', async () => {
    getClientIdentifierMock.mockReturnValue(null);

    const { POST } = await import('../route');
    const res = await POST(createRequest('visitor1234'));

    expect(res.status).toBe(200);
    expect(checkRateLimitMock).toHaveBeenCalledWith({
      key: 'demo-login:visitor:visitor1234',
      limit: 10,
      windowMs: 60_000,
    });
    expect(signUpEmailMock).toHaveBeenCalled();
  });

  it('recreates stale demo accounts when Better Auth returns stable credential codes', async () => {
    const visitorId = 'visitor1234';
    const teacherEmail = `demo.teacher.${visitorId}@eduteams.local`;

    signInEmailMock.mockRejectedValue({
      body: { code: 'INVALID_EMAIL_OR_PASSWORD' },
    });
    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email === teacherEmail) {
        return {
          id: 'stale-user',
          accounts: [{ id: 'account-1', password: 'hashed-password' }],
        };
      }

      return null;
    });

    const { POST } = await import('../route');
    const res = await POST(createRequest(visitorId));

    expect(res.status).toBe(200);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: 'stale-user' },
    });
    expect(signUpEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ email: teacherEmail }),
      })
    );
  });

  it('cleans up demo teacher courses and seeded students before resetting the account', async () => {
    const visitorId = 'visitor1234';
    const teacherEmail = `demo.teacher.${visitorId}@eduteams.local`;

    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email === teacherEmail) {
        return { id: 'demo-teacher' };
      }

      return null;
    });

    const { getDemoStudentVisitorEmailPrefix } = await import(
      '@/lib/demo/seed-students'
    );
    const { POST } = await import('../route');
    const res = await POST(createRequest(visitorId));

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.course.deleteMany).toHaveBeenCalledWith({
      where: { dosenId: 'demo-teacher' },
    });
    expect(prismaMock.teamFormationRequest.deleteMany).toHaveBeenCalledWith({
      where: { ownerId: 'demo-teacher' },
    });
    expect(prismaMock.user.deleteMany).toHaveBeenCalledWith({
      where: {
        email: {
          startsWith: getDemoStudentVisitorEmailPrefix(visitorId),
        },
      },
    });
    expect(prismaMock.courseEnrollment.deleteMany).not.toHaveBeenCalled();
    expect(revalidateTagMock.mock.calls.map(call => call[0])).toEqual([
      CACHE_TAGS.coursesByDosen('demo-teacher'),
      DASHBOARD_STATISTICS_TAG,
    ]);
  });

  it('resets the paired primary demo student when restarting a teacher demo', async () => {
    const visitorId = 'visitor1234';
    const teacherEmail = `demo.teacher.${visitorId}@eduteams.local`;
    const studentEmail = `demo.student.${visitorId}@eduteams.local`;

    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email === teacherEmail) {
        return { id: 'demo-teacher' };
      }

      if (where.email === studentEmail) {
        return { id: 'demo-student' };
      }

      return null;
    });

    const { POST } = await import('../route');
    const res = await POST(createRequest(visitorId));

    expect(res.status).toBe(200);
    expect(prismaMock.courseEnrollment.deleteMany).toHaveBeenCalledWith({
      where: {
        studentId: 'demo-student',
        course: {
          dosenId: 'demo-teacher',
        },
      },
    });
    expect(prismaMock.personalitySession.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'demo-student' },
    });
    expect(prismaMock.personalityProfile.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'demo-student' },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'demo-student' },
      data: {
        name: 'Bagas Pratama',
        role: null,
        isOnboarded: false,
        hasSeenWelcomeSplash: false,
        onboardingStep: null,
        nim: null,
        gender: null,
      },
    });
    expect(revalidateTagMock.mock.calls.map(call => call[0])).toEqual([
      CACHE_TAGS.coursesByDosen('demo-teacher'),
      DASHBOARD_STATISTICS_TAG,
      CACHE_TAGS.studentClasses('demo-student'),
    ]);
  });

  it('clears derived demo-owned student state before starting a fresh demo student session', async () => {
    const visitorId = 'visitor1234';
    const teacherEmail = `demo.teacher.${visitorId}@eduteams.local`;
    const studentEmail = `demo.student.${visitorId}@eduteams.local`;

    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email === teacherEmail) {
        return { id: 'demo-teacher' };
      }

      if (where.email === studentEmail) {
        return { id: 'demo-student' };
      }

      return null;
    });

    const { POST } = await import('../route');
    const res = await POST(createRequest(visitorId, true, 'STUDENT'));

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.assignmentSubmission.findMany).toHaveBeenCalledWith({
      where: {
        studentId: 'demo-student',
        assignment: {
          course: {
            dosenId: 'demo-teacher',
          },
        },
      },
      select: { assignmentId: true },
    });
    expect(prismaMock.courseEnrollment.deleteMany).toHaveBeenCalledWith({
      where: {
        studentId: 'demo-student',
        course: {
          dosenId: 'demo-teacher',
        },
      },
    });
    expect(prismaMock.personSkill.deleteMany).toHaveBeenCalledWith({
      where: { personId: 'demo-student' },
    });
    expect(prismaMock.studentCompetencyProfile.deleteMany).toHaveBeenCalledWith({
      where: { studentId: 'demo-student' },
    });
    expect(prismaMock.assignmentSubmission.deleteMany).toHaveBeenCalledWith({
      where: {
        studentId: 'demo-student',
        assignment: {
          course: {
            dosenId: 'demo-teacher',
          },
        },
      },
    });
    expect(prismaMock.assignmentTopicPreference.deleteMany).toHaveBeenCalledWith({
      where: {
        personId: 'demo-student',
        topic: {
          assignment: {
            course: {
              dosenId: 'demo-teacher',
            },
          },
        },
      },
    });
    expect(prismaMock.teamMember.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'demo-student',
        team: {
          teamFormationRequest: {
            ownerId: 'demo-teacher',
          },
        },
      },
    });
    expect(revalidateTagMock).toHaveBeenCalledWith(
      CACHE_TAGS.studentClasses('demo-student')
    );
  });

  it('does not delete team-formation data for non-demo courses when restarting a demo student', async () => {
    const visitorId = 'visitor1234';
    const teacherEmail = `demo.teacher.${visitorId}@eduteams.local`;
    const studentEmail = `demo.student.${visitorId}@eduteams.local`;

    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email === teacherEmail) {
        return { id: 'demo-teacher' };
      }

      if (where.email === studentEmail) {
        return { id: 'demo-student' };
      }

      return null;
    });
    prismaMock.assignmentSubmission.findMany.mockResolvedValue([
      { assignmentId: 'demo-assignment-2' },
      { assignmentId: 'demo-assignment-1' },
      { assignmentId: 'demo-assignment-2' },
    ]);
    prismaMock.teamFormationRequest.deleteMany.mockResolvedValueOnce({
      count: 2,
    });

    const { POST } = await import('../route');
    const res = await POST(createRequest(visitorId, true, 'STUDENT'));

    expect(res.status).toBe(200);
    expect(prismaMock.assignmentSubmission.findMany).toHaveBeenCalledWith({
      where: {
        studentId: 'demo-student',
        assignment: {
          course: {
            dosenId: 'demo-teacher',
          },
        },
      },
      select: { assignmentId: true },
    });
    expect(prismaMock.teamFormationRequest.deleteMany).toHaveBeenCalledWith({
      where: {
        ownerId: 'demo-teacher',
        assignmentId: {
          in: ['demo-assignment-2', 'demo-assignment-1'],
        },
      },
    });
    expect(revalidateTagMock.mock.calls.map(call => call[0])).toEqual([
      DASHBOARD_STATISTICS_TAG,
      CACHE_TAGS.studentClasses('demo-student'),
      CACHE_TAGS.coursesByDosen('demo-teacher'),
    ]);
  });

  it('bootstraps demo student enrollment during onboarding login', async () => {
    const visitorId = 'visitor1234';
    const teacherEmail = `demo.teacher.${visitorId}@eduteams.local`;
    const studentEmail = `demo.student.${visitorId}@eduteams.local`;

    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email === studentEmail) {
        return { id: 'demo-student' };
      }

      if (where.email === teacherEmail) {
        return { id: 'demo-teacher' };
      }

      return null;
    });
    prismaMock.course.findMany.mockResolvedValue([{ id: 'course-1' }]);
    prismaMock.courseEnrollment.createMany.mockResolvedValue({ count: 1 });

    const { POST } = await import('../route');
    const res = await POST(createRequest(visitorId, true, 'STUDENT'));

    expect(res.status).toBe(200);
    expect(prismaMock.personalityProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'demo-student' },
      create: {
        userId: 'demo-student',
        ei: -0.7,
        sn: -0.6,
        tf: 0.5,
        pj: 0.7,
        mbtiType: 'INFJ',
      },
      update: {},
    });
    expect(prismaMock.courseEnrollment.createMany).toHaveBeenCalledWith({
      data: [
        {
          courseId: 'course-1',
          studentId: 'demo-student',
          enrolledAt: expect.any(Date),
        },
      ],
      skipDuplicates: true,
    });
    expect(revalidateTagMock.mock.calls.map(call => call[0])).toEqual([
      CACHE_TAGS.studentClasses('demo-student'),
      CACHE_TAGS.coursesByDosen('demo-teacher'),
    ]);
  });

  it('does not create a session before resetting an existing demo account', async () => {
    const visitorId = 'visitor1234';
    const teacherEmail = `demo.teacher.${visitorId}@eduteams.local`;

    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email === teacherEmail) {
        return { id: 'demo-teacher' };
      }

      return null;
    });
    prismaMock.course.deleteMany.mockRejectedValue(new Error('reset failed'));

    const { POST } = await import('../route');
    const res = await POST(createRequest(visitorId));

    expect(res.status).toBe(500);
    expect(signInEmailMock).not.toHaveBeenCalled();
  });

  it('clears auth state when student bootstrap fails after sign-up', async () => {
    const visitorId = 'visitor1234';

    signInEmailMock.mockRejectedValue({
      body: { code: 'USER_NOT_FOUND' },
    });
    prismaMock.personalityProfile.upsert.mockRejectedValue(
      new Error('bootstrap failed')
    );

    const { POST } = await import('../route');
    const res = await POST(createRequest(visitorId, true, 'STUDENT'));

    expect(res.status).toBe(500);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: 'demo-user' },
    });
    expect(cookieStoreDeleteMock.mock.calls.map(call => call[0])).toContain(
      'better-auth.session_token'
    );
  });

  it('accepts the configured LAN dev origin', async () => {
    process.env.DEV_ALLOWED_ORIGINS = 'http://100.119.116.81:3000';

    const { POST } = await import('../route');
    const res = await POST({
      headers: new Headers({
        'content-type': 'application/json',
        origin: 'http://100.119.116.81:3000',
      }),
      cookies: {
        get: () => ({
          name: 'eduteams-demo-visitor',
          value: 'visitor1234',
        }),
      },
      text: async () => JSON.stringify({ role: 'TEACHER' }),
    } as any);

    expect(res.status).toBe(200);
    expect(signUpEmailMock).toHaveBeenCalled();
  });

  it('rejects requests that fail same-origin validation', async () => {
    const { POST } = await import('../route');
    const res = await POST(createRequest('visitor1234', false));

    expect(res.status).toBe(403);
    expect(checkRateLimitMock).not.toHaveBeenCalled();
    expect(signInEmailMock).not.toHaveBeenCalled();
  });
});
