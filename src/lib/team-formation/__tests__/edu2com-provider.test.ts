import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

const callBackgroundMock = mock(async () => undefined);
const markProcessingMock = mock(async () => undefined);
const failRequestMock = mock(async () => undefined);
const cleanupStaleRequestsMock = mock(async () => ({ count: 0 }));
const getInFlightRequestMock = mock(async () => null);
const createTeamFormationRequestMock = mock(async () => null);

mock.module('@/lib/edu2com/api', () => ({
  callEdu2comBackgroundTeamFormation: callBackgroundMock,
}));
mock.module('@/lib/team-formation/request-store', () => ({
  markTeamFormationRequestProcessing: markProcessingMock,
  cleanupStaleTeamFormationRequests: cleanupStaleRequestsMock,
  getInFlightTeamFormationRequestForAssignment: getInFlightRequestMock,
  createTeamFormationRequest: createTeamFormationRequestMock,
}));
mock.module('@/lib/team-formation/complete-request', () => ({
  failTeamFormationRequest: failRequestMock,
}));

const originalNodeEnv = process.env.NODE_ENV;
const originalBaseUrl = process.env.EDU2COM_WEBHOOK_BASE_URL;
const originalSecret = process.env.EDU2COM_WEBHOOK_SECRET;

describe('edu2com team formation provider', () => {
  beforeEach(() => {
    mock.module('next/cache', () => ({
      unstable_cache: (fn: unknown) => fn,
      revalidateTag: () => {},
      revalidatePath: () => {},
    }));
    process.env.NODE_ENV = 'production';
    process.env.EDU2COM_WEBHOOK_BASE_URL = 'https://example.com';
    process.env.EDU2COM_WEBHOOK_SECRET = 'provider-secret';
    callBackgroundMock.mockReset();
    callBackgroundMock.mockResolvedValue(undefined);
    markProcessingMock.mockReset();
    markProcessingMock.mockResolvedValue({
      id: 'req-123',
      ownerId: 'teacher-1',
      assignmentId: 'assignment-1',
      provider: 'edu2com',
      status: 'PROCESSING',
      replyPostUrl:
        'https://example.com/api/edu2com/webhook?requestId=req-123&token=test',
    });
    failRequestMock.mockReset();
    failRequestMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalBaseUrl === undefined)
      delete process.env.EDU2COM_WEBHOOK_BASE_URL;
    else process.env.EDU2COM_WEBHOOK_BASE_URL = originalBaseUrl;
    if (originalSecret === undefined)
      delete process.env.EDU2COM_WEBHOOK_SECRET;
    else process.env.EDU2COM_WEBHOOK_SECRET = originalSecret;
    mock.restore();
  });

  it('sends a signed webhook URL and marks the request as processing', async () => {
    const { edu2comTeamFormationProvider } = await import('../providers/edu2com');

    await edu2comTeamFormationProvider.launch(
      {
        id: 'req-123',
        ownerId: 'teacher-1',
        assignmentId: 'assignment-1',
        provider: 'edu2com',
        status: 'PENDING',
        replyPostUrl: null,
      },
      {
        assignment: {
          id: 'assignment-1',
          courseId: 'course-1',
          description: null,
          ownerId: 'teacher-1',
        },
        owner: { id: 'teacher-1' },
        method: 'JUMLAH_KELOMPOK',
        value: 2,
        people: [
          {
            id: 's1',
            gender: 'MALE',
            personality: { ei: 0, sn: 0, tf: 0, pj: 0 },
            skills: [{ id: 'skill-1', level: 1 }],
            preferences: [],
          },
          {
            id: 's2',
            gender: 'FEMALE',
            personality: { ei: 0, sn: 0, tf: 0, pj: 0 },
            skills: [{ id: 'skill-1', level: 0.5 }],
            preferences: [],
          },
        ],
        tasks: [
          {
            id: 'task-1',
            teamSize: 2,
            skills: [{ id: 'skill-1', level: 0.5, importance: 1 }],
          },
        ],
        weights: { alpha: 0.4, beta: 0.3, gamma: 0.2, delta: 0.1 },
        initRandom: false,
        requestData: {
          people: [
            {
              id: 's1',
              gender: 'MALE',
              personality: { ei: 0, sn: 0, tf: 0, pj: 0 },
              skills: [{ id: 'skill-1', level: 1 }],
              preferences: [],
            },
            {
              id: 's2',
              gender: 'FEMALE',
              personality: { ei: 0, sn: 0, tf: 0, pj: 0 },
              skills: [{ id: 'skill-1', level: 0.5 }],
              preferences: [],
            },
          ],
          tasks: [
            {
              id: 'task-1',
              teamSize: 2,
              skills: [{ id: 'skill-1', level: 0.5, importance: 1 }],
            },
          ],
          alpha: 0.4,
          beta: 0.3,
          gamma: 0.2,
          delta: 0.1,
          initRandom: false,
        },
        counts: {
          enrolledStudents: 2,
          submittedStudents: 2,
          eligibleStudents: 2,
          excludedWithoutSubmission: 0,
          excludedWithoutCompletePersonality: 0,
          taskCount: 1,
          totalTeamCapacity: 2,
        },
      } as any
    );

    expect(callBackgroundMock).toHaveBeenCalledWith(
      expect.objectContaining({
        replyPostUrl: expect.stringContaining(
          '/api/edu2com/webhook?requestId=req-123&token='
        ),
      }),
      expect.any(Object)
    );
    expect(markProcessingMock).toHaveBeenCalledWith('req-123', {
      replyPostUrl: expect.stringContaining(
        '/api/edu2com/webhook?requestId=req-123&token='
      ),
    });
  });

  it('preserves a request that already completed before the dispatch returns', async () => {
    markProcessingMock.mockResolvedValue({
      id: 'req-123',
      ownerId: 'teacher-1',
      assignmentId: 'assignment-1',
      provider: 'edu2com',
      status: 'COMPLETED',
      replyPostUrl:
        'https://example.com/api/edu2com/webhook?requestId=req-123&token=test',
    });

    const { edu2comTeamFormationProvider } = await import('../providers/edu2com');
    const result = await edu2comTeamFormationProvider.launch(
      {
        id: 'req-123',
        ownerId: 'teacher-1',
        assignmentId: 'assignment-1',
        provider: 'edu2com',
        status: 'PENDING',
        replyPostUrl: null,
      },
      {
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
          enrolledStudents: 2,
          submittedStudents: 2,
          eligibleStudents: 2,
          excludedWithoutSubmission: 0,
          excludedWithoutCompletePersonality: 0,
          taskCount: 1,
          totalTeamCapacity: 2,
        },
      } as any
    );

    expect(result.status).toBe('COMPLETED');
    expect(callBackgroundMock).toHaveBeenCalled();
  });
});
