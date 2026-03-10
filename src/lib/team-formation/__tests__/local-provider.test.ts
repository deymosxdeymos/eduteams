import { beforeEach, describe, expect, it, mock } from 'bun:test';

const builtPayload = {
  assignment: {
    id: 'assignment-1',
    courseId: 'course-1',
    description: null,
    ownerId: 'teacher-1',
  },
  owner: { id: 'teacher-1' },
  method: 'JUMLAH_KELOMPOK' as const,
  value: 2,
  people: [
    {
      id: 's4',
      gender: 'MALE' as const,
      personality: { ei: 0, sn: 0, tf: 0, pj: 0 },
      skills: [{ id: 'skill-a', level: 0.4 }],
      preferences: [],
    },
    {
      id: 's2',
      gender: 'FEMALE' as const,
      personality: { ei: 0, sn: 0, tf: 0, pj: 0 },
      skills: [{ id: 'skill-a', level: 0.9 }],
      preferences: [],
    },
    {
      id: 's1',
      gender: 'MALE' as const,
      personality: { ei: 0, sn: 0, tf: 0, pj: 0 },
      skills: [{ id: 'skill-b', level: 0.9 }],
      preferences: [],
    },
    {
      id: 's3',
      gender: 'FEMALE' as const,
      personality: { ei: 0, sn: 0, tf: 0, pj: 0 },
      skills: [{ id: 'skill-b', level: 0.6 }],
      preferences: [],
    },
  ],
  tasks: [
    {
      id: 'task-1',
      teamSize: 2,
      skills: [{ id: 'skill-a', level: 0.5, importance: 1 }],
    },
    {
      id: 'task-2',
      teamSize: 2,
      skills: [{ id: 'skill-b', level: 0.5, importance: 1 }],
    },
  ],
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
};

describe('local team formation provider', () => {
  beforeEach(() => {
    mock.module('next/cache', () => ({
      unstable_cache: (fn: unknown) => fn,
      revalidateTag: () => {},
      revalidatePath: () => {},
    }));
  });

  it('produces deterministic groupings with exact task sizes', async () => {
    const { buildLocalTeamsResponse } = await import('../providers/local');
    const first = buildLocalTeamsResponse(builtPayload as any);
    const second = buildLocalTeamsResponse(builtPayload as any);

    expect(first).toEqual(second);
    expect(first.teams.map(team => team.people.length)).toEqual([2, 2]);
    expect(first.teams.every(team => team.quality === null)).toBe(true);
  });

  it('does not duplicate or omit students', async () => {
    const { buildLocalTeamsResponse } = await import('../providers/local');
    const result = buildLocalTeamsResponse(builtPayload as any);
    const assignedIds = result.teams.flatMap(team =>
      team.people.map(person => person.id)
    );

    expect(new Set(assignedIds)).toEqual(new Set(['s1', 's2', 's3', 's4']));
    expect(assignedIds).toHaveLength(4);
  });
});
