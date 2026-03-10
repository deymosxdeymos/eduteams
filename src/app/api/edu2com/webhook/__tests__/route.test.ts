import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { createHmac } from 'node:crypto';
import { createApiUtilsModule } from '@/test-utils/api-utils-module';

const prismaMock = {
  teamFormationRequest: {
    findUnique: mock(async () => ({
      id: 'req-1',
      status: 'PROCESSING',
    })),
  },
};

const completeTeamFormationRequestMock = mock(async () => ({
  didComplete: true,
}));
const failTeamFormationRequestMock = mock(async () => undefined);
const normalizePayloadMock = mock((payload: unknown) => payload);

function validToken(requestId: string, secret: string) {
  return createHmac('sha256', secret).update(requestId).digest('hex');
}

describe('POST /api/edu2com/webhook', () => {
  beforeEach(() => {
    process.env.EDU2COM_WEBHOOK_SECRET = 'test-webhook-secret';

    prismaMock.teamFormationRequest.findUnique.mockReset();
    prismaMock.teamFormationRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      status: 'PROCESSING',
    });
    completeTeamFormationRequestMock.mockReset();
    completeTeamFormationRequestMock.mockResolvedValue({
      didComplete: true,
    });
    failTeamFormationRequestMock.mockReset();
    failTeamFormationRequestMock.mockResolvedValue(undefined);
    normalizePayloadMock.mockReset();
    normalizePayloadMock.mockImplementation(payload => payload);

    mock.module('@/lib/api-utils', () => createApiUtilsModule());
    mock.module('@/lib/prisma', () => ({ default: prismaMock }));
    mock.module('@/lib/team-formation/complete-request', () => ({
      completeTeamFormationRequest: completeTeamFormationRequestMock,
      failTeamFormationRequest: failTeamFormationRequestMock,
      normalizeAndValidateTeamFormationCompletionPayload: normalizePayloadMock,
    }));
  });

  afterEach(() => {
    mock.restore();
    delete process.env.EDU2COM_WEBHOOK_SECRET;
  });

  it('completes a valid callback through the shared completion service', async () => {
    const { POST } = await import('../route');
    const req = new Request(
      `http://localhost/api/edu2com/webhook?requestId=req-1&token=${validToken('req-1', 'test-webhook-secret')}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ teams: [{ taskId: 't1', quality: 0.8, people: [{ id: 's1', skillIds: [] }] }] }),
      }
    );

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(normalizePayloadMock).toHaveBeenCalled();
    expect(completeTeamFormationRequestMock).toHaveBeenCalledWith('req-1', {
      teams: [{ taskId: 't1', quality: 0.8, people: [{ id: 's1', skillIds: [] }] }],
    });
  });

  it('returns a successful no-op when the request is already completed', async () => {
    prismaMock.teamFormationRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      status: 'COMPLETED',
    });

    const { POST } = await import('../route');
    const req = new Request(
      `http://localhost/api/edu2com/webhook?requestId=req-1&token=${validToken('req-1', 'test-webhook-secret')}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ teams: [] }),
      }
    );

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(json.data.noOp).toBe(true);
    expect(completeTeamFormationRequestMock).not.toHaveBeenCalled();
  });

  it('rejects invalid tokens', async () => {
    const { POST } = await import('../route');
    const req = new Request(
      'http://localhost/api/edu2com/webhook?requestId=req-1&token=bad-token',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ teams: [] }),
      }
    );

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(prismaMock.teamFormationRequest.findUnique).not.toHaveBeenCalled();
  });

  it('marks the request as failed when the payload is invalid', async () => {
    normalizePayloadMock.mockImplementation(() => {
      throw new Error('Invalid Edu2com payload');
    });

    const { POST } = await import('../route');
    const req = new Request(
      `http://localhost/api/edu2com/webhook?requestId=req-1&token=${validToken('req-1', 'test-webhook-secret')}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ invalid: true }),
      }
    );

    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(failTeamFormationRequestMock).toHaveBeenCalledWith(
      'req-1',
      'Invalid Edu2com payload'
    );
    expect(completeTeamFormationRequestMock).not.toHaveBeenCalled();
  });
});

