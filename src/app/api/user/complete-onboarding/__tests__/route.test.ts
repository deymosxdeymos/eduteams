import { beforeEach, describe, expect, it, mock } from 'bun:test';

const indonesianBank = {
  bankVersion: 1,
  locale: 'id-ID',
  questions: [
    {
      id: 'id-q1',
      bankVersion: 1,
      locale: 'id-ID',
      text: 'q1',
      dimension: 'ei',
      orderHint: 1,
      reversed: false,
      isAttentionCheck: false,
    },
    {
      id: 'id-q2',
      bankVersion: 1,
      locale: 'id-ID',
      text: 'q2',
      dimension: 'sn',
      orderHint: 2,
      reversed: false,
      isAttentionCheck: false,
    },
    {
      id: 'id-q3',
      bankVersion: 1,
      locale: 'id-ID',
      text: 'q3',
      dimension: 'tf',
      orderHint: 3,
      reversed: false,
      isAttentionCheck: false,
    },
    {
      id: 'id-q4',
      bankVersion: 1,
      locale: 'id-ID',
      text: 'q4',
      dimension: 'pj',
      orderHint: 4,
      reversed: false,
      isAttentionCheck: false,
    },
  ],
} as const;

const englishBank = {
  bankVersion: 2,
  locale: 'en-US',
  questions: [
    {
      id: 'en-q1',
      bankVersion: 2,
      locale: 'en-US',
      text: 'q1',
      dimension: 'ei',
      orderHint: 1,
      reversed: false,
      isAttentionCheck: false,
    },
    {
      id: 'en-q2',
      bankVersion: 2,
      locale: 'en-US',
      text: 'q2',
      dimension: 'sn',
      orderHint: 2,
      reversed: false,
      isAttentionCheck: false,
    },
    {
      id: 'en-q3',
      bankVersion: 2,
      locale: 'en-US',
      text: 'q3',
      dimension: 'tf',
      orderHint: 3,
      reversed: false,
      isAttentionCheck: false,
    },
    {
      id: 'en-q4',
      bankVersion: 2,
      locale: 'en-US',
      text: 'q4',
      dimension: 'pj',
      orderHint: 4,
      reversed: false,
      isAttentionCheck: false,
    },
  ],
} as const;

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({ id: 'u1', role: 'mahasiswa' })),
    update: mock(async () => ({})),
  },
};

const getActivePersonalityBankMock = mock(
  async (_locale?: string) => indonesianBank
);

mock.module('@/lib/prisma', () => ({ default: prismaMock }));
mock.module('@/lib/mbti-questions-simple', () => ({
  getActivePersonalityBank: getActivePersonalityBankMock,
}));

describe('POST /api/user/complete-onboarding', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.findUnique.mockImplementation(async () => ({
      id: 'u1',
      role: 'mahasiswa',
    }));

    prismaMock.user.update.mockReset();
    prismaMock.user.update.mockImplementation(async () => ({}));

    getActivePersonalityBankMock.mockReset();
    getActivePersonalityBankMock.mockImplementation(
      async (_locale?: string) => indonesianBank
    );
  });

  it('calculates personality for mahasiswa answers', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { POST } = await import('../route');
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 4; i++) answers[String(i)] = 3;
    const req = new Request('http://localhost/api/user/complete-onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('uses matching bank when answers are keyed by question id', async () => {
    getActivePersonalityBankMock.mockImplementation(
      async (locale?: string): Promise<any> => {
        if (!locale) return indonesianBank;
        if (locale === 'en-US') return englishBank;
        if (locale === 'id-ID') return indonesianBank;
        return null;
      }
    );

    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { POST } = await import('../route');
    const answers: Record<string, number> = {
      'en-q1': 5,
      'en-q2': 4,
      'en-q3': 3,
      'en-q4': 2,
    };

    const req = new Request('http://localhost/api/user/complete-onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers }),
    });

    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    expect(
      getActivePersonalityBankMock.mock.calls.some(
        ([locale]) => locale === 'en-US'
      )
    ).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalled();
    const updateArg = prismaMock.user.update.mock.calls[0][0];
    const personalityData = (updateArg.data.personalityData as any) ?? {};
    expect(personalityData.answers['en-q1']).toBe(5);
  });

  it('rejects answers with mismatched question IDs (v2 IDs with v3 bank)', async () => {
    const v3Bank = {
      bankVersion: 3 as const,
      locale: 'id-ID' as const,
      questions: [
        {
          id: 'v3-new-q1',
          bankVersion: 3,
          locale: 'id-ID',
          text: 'q1',
          dimension: 'ei' as const,
          orderHint: 1,
          reversed: false,
          isAttentionCheck: false,
        },
        {
          id: 'v3-new-q2',
          bankVersion: 3,
          locale: 'id-ID',
          text: 'q2',
          dimension: 'sn' as const,
          orderHint: 2,
          reversed: false,
          isAttentionCheck: false,
        },
      ] as const,
    };

    getActivePersonalityBankMock.mockImplementation(async () => v3Bank as any);

    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { POST } = await import('../route');

    const answersWithV2Ids: Record<string, number> = {
      'id-q1': 5,
      'id-q2': 4,
    };

    const req = new Request('http://localhost/api/user/complete-onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers: answersWithV2Ids }),
    });

    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
