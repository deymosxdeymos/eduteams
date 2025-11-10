import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createHmac } from 'node:crypto';

process.env.EDU2COM_WEBHOOK_SECRET = 'test-webhook-secret';

const revalidateTagMock = mock(() => {});
mock.module('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  unstable_cache: () => {},
}));

const authMock = {
  auth: {
    api: {
      getSession: mock(async () => ({ user: { id: 'u1' } })),
    },
  },
};
mock.module('@/lib/auth', () => authMock);

const prismaMock = {
  teamFormationRequest: {
    findUnique: mock(async () => ({
      id: 'req-1',
      assignmentId: 'assign-1',
    })),
    update: mock(async () => ({})),
  },
  team: {
    deleteMany: mock(async () => ({})),
  },
  assignment: {
    update: mock(async () => ({})),
  },
  $transaction: mock(async (operations: Array<Promise<unknown>>) => {
    for (const op of operations) {
      await op;
    }
    return operations;
  }),
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

const validToken = (requestId: string) =>
  createHmac('sha256', process.env.EDU2COM_WEBHOOK_SECRET || 'fallback-secret')
    .update(requestId)
    .digest('hex');

beforeEach(() => {
  revalidateTagMock.mockClear();
  prismaMock.teamFormationRequest.findUnique.mockClear();
  prismaMock.teamFormationRequest.update.mockClear();
  prismaMock.team.deleteMany.mockClear();
  prismaMock.assignment.update.mockClear();
});

describe('POST /api/edu2com/webhook', () => {
  it('persists teams when payload and token are valid', async () => {
    const { POST } = await import('../route');
    const payload = {
      teams: [
        {
          taskId: 'task-1',
          quality: 0.8,
          people: [
            { id: 'u-1', skillIds: ['skill-1'] },
            { id: 'u-2', skillIds: ['skill-2'] },
          ],
        },
      ],
    };
    const req = new Request(
      `http://localhost/api/edu2com/webhook?requestId=req-1&token=${validToken('req-1')}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(prismaMock.team.deleteMany).toHaveBeenCalledWith({
      where: { teamFormationRequestId: 'req-1' },
    });
    expect(prismaMock.teamFormationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPLETED',
          teams: expect.any(Object),
        }),
      })
    );
    expect(prismaMock.assignment.update).toHaveBeenCalled();
    expect(revalidateTagMock).toHaveBeenCalled();
  });

  it('rejects invalid tokens', async () => {
    const { POST } = await import('../route');
    const req = new Request(
      'http://localhost/api/edu2com/webhook?requestId=req-1&token=bad',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ teams: [] }),
      }
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(prismaMock.teamFormationRequest.update).not.toHaveBeenCalled();
  });

  it('marks request as failed when payload is invalid', async () => {
    const { POST } = await import('../route');
    const req = new Request(
      `http://localhost/api/edu2com/webhook?requestId=req-1&token=${validToken('req-1')}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ not: 'expected' }),
      }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(prismaMock.teamFormationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
        }),
      })
    );
  });
});
