import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { createApiUtilsModule } from '@/test-utils/api-utils-module';

const currentUserMock = mock(async () => ({
  id: 'teacher-1',
  role: 'TEACHER',
  isOnboarded: true,
}));
const isSameOriginMock = mock(() => true);
const checkRateLimitMock = mock(async () => ({
  allowed: true,
  retryAfterSeconds: 60,
}));
const getClientIdentifierMock = mock(() => null);
const cleanupStaleRequestsMock = mock(async () => ({ count: 0 }));
const getInFlightRequestMock = mock(async () => null);
const createTeamFormationRequestMock = mock(async () => ({
  id: 'req-1',
  ownerId: 'teacher-1',
  assignmentId: 'assignment-1',
  provider: 'local',
  status: 'PENDING',
  replyPostUrl: null,
}));
const buildPayloadMock = mock(async () => ({
  assignment: {
    id: 'assignment-1',
    courseId: 'course-1',
    description: null,
    ownerId: 'teacher-1',
  },
  owner: { id: 'teacher-1' },
  method: 'JUMLAH_KELOMPOK',
  value: 2,
  people: [],
  tasks: [],
  weights: { alpha: 0.4, beta: 0.3, gamma: 0.2, delta: 0.1 },
  initRandom: false,
  requestData: {
    people: [],
    tasks: [],
    alpha: 0.4,
    beta: 0.3,
    gamma: 0.2,
    delta: 0.1,
    initRandom: false,
  },
  counts: {
    enrolledStudents: 4,
    submittedStudents: 4,
    eligibleStudents: 4,
    excludedWithoutSubmission: 0,
    excludedWithoutCompletePersonality: 0,
    taskCount: 2,
    totalTeamCapacity: 4,
  },
}));
const resolveProviderMock = mock(() => 'local' as const);
const assertEdu2comProviderConfigurationMock = mock(() => {});
const launchMock = mock(async () => ({
  requestId: 'req-1',
  provider: 'local' as const,
  mode: 'sync' as const,
  status: 'COMPLETED' as const,
}));
const getTeamFormationProviderMock = mock(() => ({
  launch: launchMock,
}));

const originalNodeEnv = process.env.NODE_ENV;
const originalDemoMode = process.env.DEMO_MODE;

function applyModuleMocks() {
  mock.module('next/cache', () => ({
    unstable_cache: (fn: unknown) => fn,
    revalidateTag: () => {},
    revalidatePath: () => {},
  }));
  mock.module('@/lib/api-utils', () =>
    createApiUtilsModule({
      withRole:
        (_allowedRoles: unknown, handler: (req: any, ctx: any) => Promise<any>) =>
        async (req: any, ctx: any) =>
          handler(req, { ...ctx, user: await currentUserMock() }),
    })
  );
  mock.module('@/lib/csrf', () => ({ isSameOrigin: isSameOriginMock }));
  mock.module('@/lib/rate-limit', () => ({
    checkRateLimit: checkRateLimitMock,
    getClientIdentifier: getClientIdentifierMock,
  }));
  mock.module('@/lib/team-formation/request-store', () => ({
    cleanupStaleTeamFormationRequests: cleanupStaleRequestsMock,
    getInFlightTeamFormationRequestForAssignment: getInFlightRequestMock,
    createTeamFormationRequest: createTeamFormationRequestMock,
  }));
  mock.module('@/lib/team-formation/build-payload', () => ({
    buildTeamFormationPayload: buildPayloadMock,
  }));
  mock.module('@/lib/team-formation/config', () => ({
    resolveTeamFormationProvider: resolveProviderMock,
    assertEdu2comProviderConfiguration:
      assertEdu2comProviderConfigurationMock,
  }));
  mock.module('@/lib/team-formation/providers', () => ({
    getTeamFormationProvider: getTeamFormationProviderMock,
  }));
}

describe('POST /api/assignments/[id]/form-teams', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    delete process.env.DEMO_MODE;
    applyModuleMocks();

    currentUserMock.mockReset();
    currentUserMock.mockResolvedValue({
      id: 'teacher-1',
      role: 'TEACHER',
      isOnboarded: true,
    });
    isSameOriginMock.mockReset();
    isSameOriginMock.mockReturnValue(true);
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 60,
    });
    getClientIdentifierMock.mockReset();
    getClientIdentifierMock.mockReturnValue(null);
    cleanupStaleRequestsMock.mockReset();
    cleanupStaleRequestsMock.mockResolvedValue({ count: 0 });
    getInFlightRequestMock.mockReset();
    getInFlightRequestMock.mockResolvedValue(null);
    createTeamFormationRequestMock.mockReset();
    createTeamFormationRequestMock.mockResolvedValue({
      id: 'req-1',
      ownerId: 'teacher-1',
      assignmentId: 'assignment-1',
      provider: 'local',
      status: 'PENDING',
      replyPostUrl: null,
    });
    buildPayloadMock.mockReset();
    buildPayloadMock.mockResolvedValue({
      assignment: {
        id: 'assignment-1',
        courseId: 'course-1',
        description: null,
        ownerId: 'teacher-1',
      },
      owner: { id: 'teacher-1' },
      method: 'JUMLAH_KELOMPOK',
      value: 2,
      people: [],
      tasks: [],
      weights: { alpha: 0.4, beta: 0.3, gamma: 0.2, delta: 0.1 },
      initRandom: false,
      requestData: {
        people: [],
        tasks: [],
        alpha: 0.4,
        beta: 0.3,
        gamma: 0.2,
        delta: 0.1,
        initRandom: false,
      },
      counts: {
        enrolledStudents: 4,
        submittedStudents: 4,
        eligibleStudents: 4,
        excludedWithoutSubmission: 0,
        excludedWithoutCompletePersonality: 0,
        taskCount: 2,
        totalTeamCapacity: 4,
      },
    });
    resolveProviderMock.mockReset();
    resolveProviderMock.mockReturnValue('local');
    assertEdu2comProviderConfigurationMock.mockReset();
    assertEdu2comProviderConfigurationMock.mockReturnValue(undefined);
    launchMock.mockReset();
    launchMock.mockResolvedValue({
      requestId: 'req-1',
      provider: 'local',
      mode: 'sync',
      status: 'COMPLETED',
    });
    getTeamFormationProviderMock.mockReset();
    getTeamFormationProviderMock.mockReturnValue({ launch: launchMock });
  });

  afterEach(() => {
    mock.restore();
    process.env.NODE_ENV = originalNodeEnv;
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }
  });

  it('returns 200 and COMPLETED for the local provider', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });

    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data).toEqual({
      requestId: 'req-1',
      status: 'COMPLETED',
      provider: 'local',
      mode: 'sync',
    });
    expect(createTeamFormationRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'local',
        assignmentId: 'a1',
      })
    );
  });

  it('returns 202 and PROCESSING for the edu2com provider', async () => {
    resolveProviderMock.mockReturnValue('edu2com');
    createTeamFormationRequestMock.mockResolvedValue({
      id: 'req-2',
      ownerId: 'teacher-1',
      assignmentId: 'assignment-1',
      provider: 'edu2com',
      status: 'PENDING',
      replyPostUrl: null,
    });
    launchMock.mockResolvedValue({
      requestId: 'req-2',
      provider: 'edu2com',
      mode: 'async',
      status: 'PROCESSING',
    });

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });

    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );

    expect(res.status).toBe(202);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data).toEqual({
      requestId: 'req-2',
      status: 'PROCESSING',
      provider: 'edu2com',
      mode: 'async',
    });
    expect(assertEdu2comProviderConfigurationMock).toHaveBeenCalledTimes(1);
    expect(getTeamFormationProviderMock).toHaveBeenCalledWith('edu2com');
  });

  it('returns a clear server error for misconfigured edu2com mode', async () => {
    resolveProviderMock.mockReturnValue('edu2com');
    assertEdu2comProviderConfigurationMock.mockImplementation(() => {
      throw new Error(
        'EDU2COM_WEBHOOK_BASE_URL is required when TEAM_FORMATION_PROVIDER=edu2com.'
      );
    });

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });

    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );

    expect(res.status).toBe(500);
    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
    expect(json.error).toContain('EDU2COM_WEBHOOK_BASE_URL');
    expect(createTeamFormationRequestMock).not.toHaveBeenCalled();
  });

  it('keeps same-origin protection unchanged', async () => {
    isSameOriginMock.mockReturnValue(false);
    process.env.ENFORCE_SAME_ORIGIN_MUTATIONS = '1';

    try {
      const { POST } = await import('../route');
      const req = new Request('http://localhost/api/assignments/a1/form-teams', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
      });

      const res = await POST(
        req as any,
        { params: Promise.resolve({ id: 'a1' }) } as any
      );

      expect(res.status).toBe(403);
      expect(buildPayloadMock).not.toHaveBeenCalled();
    } finally {
      delete process.env.ENFORCE_SAME_ORIGIN_MUTATIONS;
    }
  });

  it('keeps the in-flight request conflict unchanged', async () => {
    getInFlightRequestMock.mockResolvedValue({ id: 'existing-request' });

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });

    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );

    expect(res.status).toBe(409);
    expect(buildPayloadMock).not.toHaveBeenCalled();
    expect(createTeamFormationRequestMock).not.toHaveBeenCalled();
  });

  it('keeps the user rate limit unchanged', async () => {
    checkRateLimitMock.mockImplementation(async ({ key }: { key: string }) => {
      if (key === 'form-teams:user:teacher-1') {
        return { allowed: false, retryAfterSeconds: 60 };
      }

      return { allowed: true, retryAfterSeconds: 60 };
    });

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });

    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );

    expect(res.status).toBe(429);
    expect(buildPayloadMock).not.toHaveBeenCalled();
  });
});
