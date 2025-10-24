import { beforeEach, describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 's1',
      role: 'mahasiswa',
      nimNpm: '123',
      isOnboarded: false,
      onboardingStep: 'data-diri',
    })),
  },
};

const sessionStatusMock = mock(async () => null);

mock.module('@/lib/prisma', () => ({ default: prismaMock }));
mock.module('@/lib/personality-session', () => ({
  getUserPersonalitySessionStatus: sessionStatusMock,
  submitPersonalitySession: async () => {
    throw new Error('submitPersonalitySession mock not implemented');
  },
}));

describe('GET /api/user/onboarding-status', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.findUnique.mockImplementation(async () => ({
      id: 's1',
      role: 'mahasiswa',
      nimNpm: '123',
      isOnboarded: false,
      onboardingStep: 'data-diri',
    }));

    sessionStatusMock.mockReset();
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
  });

  it('routes mahasiswa with pending session to kepribadian and returns session metadata', async () => {
    sessionStatusMock.mockResolvedValueOnce({
      bankVersion: 1,
      locale: 'en-US',
      status: 'in_progress',
      sessionId: 'sess-1',
      presentedOrder: ['q1'],
    });

    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.redirectUrl).toBe('/onboarding/kepribadian');
    expect(json.personality.hasActiveSession).toBe(true);
    expect(json.personality.canStartNew).toBe(false);
    expect(json.personality.status).toBe('in_progress');
  });

  it('redirects mahasiswa without profile data to data-diri', async () => {
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 's1',
      role: 'mahasiswa',
      nimNpm: null,
      isOnboarded: false,
      onboardingStep: 'data-diri',
    }));

    sessionStatusMock.mockResolvedValueOnce({
      bankVersion: 1,
      locale: 'en-US',
      status: 'not_started',
    });

    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.redirectUrl).toBe('/onboarding/data-diri/mahasiswa');
    expect(json.personality.status).toBe('not_started');
    expect(json.personality.canStartNew).toBe(true);
  });

  it('sends completed mahasiswa to dashboard when session is valid', async () => {
    sessionStatusMock.mockResolvedValueOnce({
      bankVersion: 1,
      locale: 'en-US',
      status: 'completed_valid',
      sessionId: 'sess-2',
      attentionPassed: true,
      durationMs: 120000,
      submittedAt: '2025-10-16T15:00:00.000Z',
    });

    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.redirectUrl).toBe('/dashboard?firstVisit=true');
    expect(json.personality.canStartNew).toBe(false);
  });

  it('redirects to resume when role is missing', async () => {
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 's1',
      role: null,
      nimNpm: null,
      isOnboarded: false,
      onboardingStep: 'role',
    }));

    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.redirectUrl).toBe('/onboarding/resume');
    expect(json.personality).toBeNull();
    expect(sessionStatusMock.mock.calls.length).toBe(0);
  });
});
