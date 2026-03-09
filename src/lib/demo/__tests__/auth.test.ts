import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

const actualPrisma = await import('@/lib/prisma');

const prismaMock = {
  user: {
    findUnique: mock(async () => null),
  },
};

function applyModuleMocks() {
  mock.module('@/lib/prisma', () => ({ default: prismaMock }));
}

function restoreModuleMocks() {
  mock.module('@/lib/prisma', () => ({ default: actualPrisma.default }));
}

const invalidCredentialCodeError = {
  body: { code: 'INVALID_EMAIL_OR_PASSWORD' },
};

describe('getDemoAuthRecoveryState', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();
  });

  it('allows sign-up when the demo user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const { getDemoAuthRecoveryState } = await import('../auth');
    await expect(
      getDemoAuthRecoveryState(
        'demo.student.visitor1234@eduteams.local',
        invalidCredentialCodeError
      )
    ).resolves.toEqual({ type: 'missing-user' });
  });

  it('allows stale-user recovery only when the credential account is missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      accounts: [],
    });

    const { getDemoAuthRecoveryState } = await import('../auth');
    await expect(
      getDemoAuthRecoveryState(
        'demo.student.visitor1234@eduteams.local',
        invalidCredentialCodeError
      )
    ).resolves.toEqual({
      type: 'missing-credential',
      userId: 'user-1',
      credentialAccountId: null,
    });
  });

  it('detects stale demo credentials without requiring the user row to be recreated', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      accounts: [{ id: 'account-1', password: 'hashed-password' }],
    });

    const { getDemoAuthRecoveryState } = await import('../auth');
    await expect(
      getDemoAuthRecoveryState(
        'demo.student.visitor1234@eduteams.local',
        invalidCredentialCodeError
      )
    ).resolves.toEqual({
      type: 'stale-credential',
      userId: 'user-1',
      credentialAccountId: 'account-1',
    });
  });

  it('ignores message-only Better Auth failures without explicit codes', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const { getBetterAuthErrorCode, getDemoAuthRecoveryState } =
      await import('../auth');
    const messageOnlyError = {
      body: {
        message: 'Invalid email or password',
      },
    };

    expect(getBetterAuthErrorCode(messageOnlyError)).toBeNull();
    await expect(
      getDemoAuthRecoveryState(
        'demo.student.visitor1234@eduteams.local',
        messageOnlyError
      )
    ).resolves.toBeNull();
  });

  it('ignores unrelated auth failures', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const { getDemoAuthRecoveryState } = await import('../auth');
    await expect(
      getDemoAuthRecoveryState('demo.student.visitor1234@eduteams.local', {
        body: { code: 'FAILED_TO_CREATE_SESSION' },
      })
    ).resolves.toBeNull();
  });
});
