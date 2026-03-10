import { beforeEach, describe, expect, it, mock } from 'bun:test';

const revalidateTagMock = mock(() => {});
mock.module('next/cache', () => ({
  revalidateTag: revalidateTagMock,
}));

const prismaMock = {
  teamFormationRequest: {
    findUnique: mock(async () => ({
      id: 'req-1',
      status: 'PROCESSING',
      assignmentId: 'assignment-1',
      requestData: {
        people: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
      },
    })),
    update: mock(async () => ({})),
  },
  team: {
    deleteMany: mock(async () => ({})),
  },
  assignment: {
    update: mock(async () => ({})),
  },
  $transaction: mock(async (callback: (tx: any) => Promise<unknown>) =>
    callback(prismaMock)
  ),
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('completeTeamFormationRequest', () => {
  beforeEach(() => {
    revalidateTagMock.mockClear();
    prismaMock.teamFormationRequest.findUnique.mockReset();
    prismaMock.teamFormationRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      status: 'PROCESSING',
      assignmentId: 'assignment-1',
      requestData: {
        people: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
      },
    });
    prismaMock.team.deleteMany.mockClear();
    prismaMock.teamFormationRequest.update.mockClear();
    prismaMock.assignment.update.mockClear();
  });

  it('persists teams, appends unassigned students, and updates assignment status', async () => {
    const { completeTeamFormationRequest } = await import('../complete-request');

    const result = await completeTeamFormationRequest('req-1', {
      teams: [
        {
          taskId: 'task-1',
          quality: 0.8,
          people: [{ id: 's1', skillIds: [] }],
        },
        {
          taskId: 'task-2',
          quality: 0.7,
          people: [{ id: 's2', skillIds: [] }],
        },
      ],
    });

    expect(result.didComplete).toBe(true);
    expect(prismaMock.team.deleteMany).toHaveBeenCalledWith({
      where: { teamFormationRequestId: 'req-1' },
    });
    expect(prismaMock.teamFormationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPLETED',
          teams: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({
                members: expect.objectContaining({
                  create: expect.arrayContaining([
                    expect.objectContaining({ userId: 's3' }),
                  ]),
                }),
              }),
            ]),
          }),
        }),
      })
    );
    expect(prismaMock.assignment.update).toHaveBeenCalledWith({
      where: { id: 'assignment-1' },
      data: { status: 'BERHASIL_PEMBAGIAN_GRUP' },
    });
    expect(revalidateTagMock).toHaveBeenCalled();
  });

  it('returns a no-op for duplicate completion after COMPLETED', async () => {
    prismaMock.teamFormationRequest.findUnique.mockResolvedValueOnce({
      id: 'req-1',
      status: 'COMPLETED',
      assignmentId: 'assignment-1',
      requestData: {
        people: [{ id: 's1' }],
      },
    });

    const { completeTeamFormationRequest } = await import('../complete-request');
    const result = await completeTeamFormationRequest('req-1', {
      teams: [
        {
          taskId: 'task-1',
          quality: 0.8,
          people: [{ id: 's1', skillIds: [] }],
        },
      ],
    });

    expect(result.didComplete).toBe(false);
    expect(prismaMock.team.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.teamFormationRequest.update).not.toHaveBeenCalled();
  });
});
