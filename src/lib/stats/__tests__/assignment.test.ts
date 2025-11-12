import { describe, expect, it, mock } from 'bun:test';

describe('lib/stats/calculateQualityMetrics', () => {
  it('calculates metrics correctly for valid scores', async () => {
    const { calculateQualityMetrics } = await import('@/lib/stats/assignment');

    const scores = [0.7, 0.8, 0.9, 0.85, 0.75];
    const result = calculateQualityMetrics(scores);

    expect(result).not.toBeNull();
    expect(result?.min).toBe(0.7);
    expect(result?.max).toBe(0.9);
    expect(result?.mean).toBeCloseTo(0.8, 2);
    expect(result?.median).toBe(0.8);
    expect(result?.count).toBe(5);
    expect(result?.stdDev).toBeGreaterThan(0);
  });

  it('calculates median correctly for even number of scores', async () => {
    const { calculateQualityMetrics } = await import('@/lib/stats/assignment');

    const scores = [0.7, 0.8, 0.85, 0.9];
    const result = calculateQualityMetrics(scores);

    expect(result?.median).toBe(0.825);
  });

  it('calculates median correctly for odd number of scores', async () => {
    const { calculateQualityMetrics } = await import('@/lib/stats/assignment');

    const scores = [0.7, 0.8, 0.9];
    const result = calculateQualityMetrics(scores);

    expect(result?.median).toBe(0.8);
  });

  it('returns null for empty array', async () => {
    const { calculateQualityMetrics } = await import('@/lib/stats/assignment');

    const result = calculateQualityMetrics([]);
    expect(result).toBeNull();
  });

  it('handles single score', async () => {
    const { calculateQualityMetrics } = await import('@/lib/stats/assignment');

    const scores = [0.85];
    const result = calculateQualityMetrics(scores);

    expect(result?.min).toBe(0.85);
    expect(result?.max).toBe(0.85);
    expect(result?.mean).toBe(0.85);
    expect(result?.median).toBe(0.85);
    expect(result?.stdDev).toBe(0);
    expect(result?.count).toBe(1);
  });
});

// We'll mock prisma's calls used by getAssignmentStats
const prismaMock: any = {
  courseEnrollment: {
    findMany: mock(async () => []),
  },
  assignment: {
    findUnique: mock(async (_args: any) => {
      // Default assignment metadata
      return {
        description: JSON.stringify({
          skills: [
            'UI/UX Design',
            'Frontend Development',
            'Backend Development',
          ],
          topics: ['Topic A', 'Topic B'],
        }),
        startAt: new Date('2025-01-01T00:00:00Z'),
        course: { dosenId: 'd1' },
      };
    }),
  },
  skill: {
    findMany: mock(async () => []),
  },
  personSkill: {
    findMany: mock(async () => []),
  },
  assignmentTopic: {
    findMany: mock(async () => [
      { id: 't1', name: 'Topic A' },
      { id: 't2', name: 'Topic B' },
    ]),
  },
  assignmentTopicPreference: {
    findMany: mock(async () => []),
  },
  teamFormationRequest: {
    count: mock(async () => 0),
    findFirst: mock(async () => null),
  },
  assignmentSubmission: {
    count: mock(async () => 0),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('lib/stats/getAssignmentStats', () => {
  it('returns zeros for empty enrollments and preferences', async () => {
    const { getAssignmentStats } = await import('@/lib/stats/assignment');

    // Empty enrollments and no preferences by default
    prismaMock.courseEnrollment.findMany.mockImplementationOnce(async () => []);
    prismaMock.assignment.findUnique.mockImplementation(async (args: any) => {
      // Respect the selected fields
      const base = {
        description: JSON.stringify({
          skills: ['Skill A', 'Skill B'],
          topics: ['Topic A', 'Topic B'],
        }),
        startAt: new Date('2025-01-01T00:00:00Z'),
        course: { dosenId: 'd1' },
      };
      return {
        description: args?.select?.description ? base.description : undefined,
        startAt: args?.select?.startAt ? base.startAt : undefined,
        course: args?.select?.course ? base.course : undefined,
      };
    });
    prismaMock.assignmentTopic.findMany.mockImplementationOnce(async () => [
      { id: 't1', name: 'Topic A' },
      { id: 't2', name: 'Topic B' },
    ]);
    prismaMock.assignmentTopicPreference.findMany.mockImplementationOnce(
      async () => []
    );
    prismaMock.teamFormationRequest.count.mockImplementationOnce(async () => 0);

    const stats = await getAssignmentStats('a1', 'c1');

    // MBTI vector contains all 16 types with zero counts
    expect(stats.mbti.length).toBe(16);
    expect(stats.mbti.every(m => m.jumlah === 0)).toBe(true);

    // Gender zeros
    expect(stats.gender).toEqual([
      { name: 'laki', value: 0 },
      { name: 'perempuan', value: 0 },
    ]);

    // Skills taken from assignment description order, zeroed
    expect(stats.skills).toEqual([
      { label: 'Skill A', value: 0 },
      { label: 'Skill B', value: 0 },
    ]);

    // Topic preferences by description-specified topics, zeroed
    expect(stats.topicPreferences).toEqual([
      { name: 'Topic A', value: 0 },
      { name: 'Topic B', value: 0 },
    ]);

    expect(stats.teamsFormed).toBe(false);
    expect(stats.quizSubmissions).toBe(0);
    expect(stats.chartReady).toBe(false);
  });

  it('aggregates MBTI, gender, skills, topic prefs and team formation', async () => {
    const { getAssignmentStats } = await import('@/lib/stats/assignment');

    // Enrollments with MBTI & gender
    prismaMock.courseEnrollment.findMany.mockImplementationOnce(async () => [
      { studentId: 's1', student: { mbtiType: 'ENFP', gender: 'MALE' } },
      { studentId: 's2', student: { mbtiType: 'ENFP', gender: 'MALE' } },
      { studentId: 's3', student: { mbtiType: 'INTJ', gender: 'FEMALE' } },
    ]);

    // Assignment config declares skills & topics
    prismaMock.assignment.findUnique.mockImplementation(async (args: any) => {
      const base = {
        description: JSON.stringify({
          skills: ['Frontend Development', 'Backend Development'],
          topics: ['AI', 'DB'],
        }),
        startAt: new Date('2025-01-01T00:00:00Z'),
        course: { dosenId: 'd1' },
      };
      return {
        description: args?.select?.description ? base.description : undefined,
        startAt: args?.select?.startAt ? base.startAt : undefined,
        course: args?.select?.course ? base.course : undefined,
      };
    });

    // Only declared skills fetched
    prismaMock.skill.findMany.mockImplementationOnce(async () => [
      { id: 'sf', name: 'Frontend Development' },
      { id: 'sb', name: 'Backend Development' },
    ]);

    // Person skills for enrolled students
    prismaMock.personSkill.findMany.mockImplementationOnce(async () => [
      { personId: 's1', skillId: 'sf', level: 0.8 },
      { personId: 's2', skillId: 'sf', level: 0.6 },
      { personId: 's3', skillId: 'sb', level: 1.0 },
    ]);

    // Topics and preferences
    prismaMock.assignmentTopic.findMany.mockImplementationOnce(async () => [
      { id: 'tAI', name: 'AI' },
      { id: 'tDB', name: 'DB' },
    ]);
    prismaMock.assignmentTopicPreference.findMany.mockImplementationOnce(
      async () => [
        { assignmentTopicId: 'tAI', preference: 0.7 },
        { assignmentTopicId: 'tAI', preference: 0.5 },
        { assignmentTopicId: 'tDB', preference: 0.4 },
      ]
    );

    // Team formation after startAt
    prismaMock.teamFormationRequest.count.mockImplementationOnce(async () => 2);
    prismaMock.assignmentSubmission.count.mockImplementationOnce(async () => 3);

    const stats = await getAssignmentStats('a2', 'courseX');

    // MBTI counts
    const mbtiMap = new Map(
      stats.mbti.map(m => [m.kategori, m.jumlah] as const)
    );
    expect(mbtiMap.get('ENFP')).toBe(2);
    expect(mbtiMap.get('INTJ')).toBe(1);

    // Gender counts
    const genderMap = new Map(
      stats.gender.map(g => [g.name, g.value] as const)
    );
    expect(genderMap.get('laki')).toBe(2);
    expect(genderMap.get('perempuan')).toBe(1);

    // Skill averages to percent, rounded
    expect(stats.skills).toEqual([
      { label: 'Frontend Development', value: 70 }, // (0.8+0.6)/2 = 0.7 -> 70
      { label: 'Backend Development', value: 100 }, // 1.0 -> 100
    ]);

    // Topic preference averages by name order from description
    expect(stats.topicPreferences).toEqual([
      { name: 'AI', value: 60 }, // (0.7+0.5)/2 = 0.6 -> 60
      { name: 'DB', value: 40 },
    ]);

    expect(stats.teamsFormed).toBe(true);
    expect(stats.quizSubmissions).toBe(3);
    expect(stats.chartReady).toBe(true);
  });

  it('calculates team quality metrics from task-level averages when teams are formed', async () => {
    const { getAssignmentStats } = await import('@/lib/stats/assignment');

    prismaMock.courseEnrollment.findMany.mockImplementationOnce(async () => []);
    prismaMock.assignment.findUnique.mockImplementation(async (args: any) => {
      const base = {
        description: JSON.stringify({
          skills: ['Skill A'],
          topics: ['Topic A'],
        }),
        startAt: new Date('2025-01-01T00:00:00Z'),
        course: { dosenId: 'd1' },
      };
      return {
        description: args?.select?.description ? base.description : undefined,
        startAt: args?.select?.startAt ? base.startAt : undefined,
        course: args?.select?.course ? base.course : undefined,
      };
    });
    prismaMock.assignmentTopic.findMany.mockImplementationOnce(async () => [
      { id: 't1', name: 'Topic A' },
    ]);
    prismaMock.assignmentTopicPreference.findMany.mockImplementationOnce(
      async () => []
    );
    prismaMock.teamFormationRequest.count.mockImplementationOnce(async () => 1);
    prismaMock.teamFormationRequest.findFirst.mockImplementationOnce(
      async () => ({
        teams: [
          { taskId: 'task1', quality: 0.7 },
          { taskId: 'task1', quality: 0.8 },
          { taskId: 'task2', quality: 0.9 },
          { taskId: 'task2', quality: 0.85 },
          { taskId: 'task3', quality: 0.75 },
        ],
      })
    );

    const stats = await getAssignmentStats('a3', 'c3');

    expect(stats.teamsFormed).toBe(true);
    expect(stats.teamQuality).toBeDefined();
    // Task1 avg: (0.7 + 0.8) / 2 = 0.75
    // Task2 avg: (0.9 + 0.85) / 2 = 0.875
    // Task3 avg: 0.75
    // Min of task averages: 0.75
    // Max of task averages: 0.875
    // Mean of task averages: (0.75 + 0.875 + 0.75) / 3 ≈ 0.792
    expect(stats.teamQuality?.min).toBeCloseTo(0.75, 2);
    expect(stats.teamQuality?.max).toBeCloseTo(0.875, 2);
    expect(stats.teamQuality?.mean).toBeCloseTo(0.792, 2);
    expect(stats.teamQuality?.count).toBe(3);
  });

  it('does not calculate team quality when teams are not formed', async () => {
    const { getAssignmentStats } = await import('@/lib/stats/assignment');

    prismaMock.courseEnrollment.findMany.mockImplementationOnce(async () => []);
    prismaMock.assignment.findUnique.mockImplementation(async (args: any) => {
      const base = {
        description: JSON.stringify({
          skills: ['Skill A'],
          topics: ['Topic A'],
        }),
        startAt: new Date('2025-01-01T00:00:00Z'),
        course: { dosenId: 'd1' },
      };
      return {
        description: args?.select?.description ? base.description : undefined,
        startAt: args?.select?.startAt ? base.startAt : undefined,
        course: args?.select?.course ? base.course : undefined,
      };
    });
    prismaMock.assignmentTopic.findMany.mockImplementationOnce(async () => [
      { id: 't1', name: 'Topic A' },
    ]);
    prismaMock.assignmentTopicPreference.findMany.mockImplementationOnce(
      async () => []
    );
    prismaMock.teamFormationRequest.count.mockImplementationOnce(async () => 0);

    const stats = await getAssignmentStats('a4', 'c4');

    expect(stats.teamsFormed).toBe(false);
    expect(stats.teamQuality).toBeUndefined();
  });

  it('handles teams with null quality scores and groups by task', async () => {
    const { getAssignmentStats } = await import('@/lib/stats/assignment');

    prismaMock.courseEnrollment.findMany.mockImplementationOnce(async () => []);
    prismaMock.assignment.findUnique.mockImplementation(async (args: any) => {
      const base = {
        description: JSON.stringify({
          skills: ['Skill A'],
          topics: ['Topic A'],
        }),
        startAt: new Date('2025-01-01T00:00:00Z'),
        course: { dosenId: 'd1' },
      };
      return {
        description: args?.select?.description ? base.description : undefined,
        startAt: args?.select?.startAt ? base.startAt : undefined,
        course: args?.select?.course ? base.course : undefined,
      };
    });
    prismaMock.assignmentTopic.findMany.mockImplementationOnce(async () => [
      { id: 't1', name: 'Topic A' },
    ]);
    prismaMock.assignmentTopicPreference.findMany.mockImplementationOnce(
      async () => []
    );
    prismaMock.teamFormationRequest.count.mockImplementationOnce(async () => 1);
    prismaMock.teamFormationRequest.findFirst.mockImplementationOnce(
      async () => ({
        teams: [
          { taskId: 'task1', quality: 0.7 },
          { taskId: 'task1', quality: null },
          { taskId: 'task2', quality: 0.9 },
          { taskId: 'task2', quality: null },
        ],
      })
    );

    const stats = await getAssignmentStats('a5', 'c5');

    expect(stats.teamsFormed).toBe(true);
    expect(stats.teamQuality).toBeDefined();
    // Task1 avg: 0.7 (null is skipped)
    // Task2 avg: 0.9 (null is skipped)
    // So we have 2 task averages
    expect(stats.teamQuality?.count).toBe(2);
    expect(stats.teamQuality?.min).toBe(0.7);
    expect(stats.teamQuality?.max).toBe(0.9);
  });

  it('handles teams with null taskId (unassigned teams)', async () => {
    const { getAssignmentStats } = await import('@/lib/stats/assignment');

    prismaMock.courseEnrollment.findMany.mockImplementationOnce(async () => []);
    prismaMock.assignment.findUnique.mockImplementation(async (args: any) => {
      const base = {
        description: JSON.stringify({
          skills: ['Skill A'],
          topics: ['Topic A'],
        }),
        startAt: new Date('2025-01-01T00:00:00Z'),
        course: { dosenId: 'd1' },
      };
      return {
        description: args?.select?.description ? base.description : undefined,
        startAt: args?.select?.startAt ? base.startAt : undefined,
        course: args?.select?.course ? base.course : undefined,
      };
    });
    prismaMock.assignmentTopic.findMany.mockImplementationOnce(async () => [
      { id: 't1', name: 'Topic A' },
    ]);
    prismaMock.assignmentTopicPreference.findMany.mockImplementationOnce(
      async () => []
    );
    prismaMock.teamFormationRequest.count.mockImplementationOnce(async () => 1);
    prismaMock.teamFormationRequest.findFirst.mockImplementationOnce(
      async () => ({
        teams: [
          { taskId: 'task1', quality: 0.7 },
          { taskId: null, quality: 0.8 },
          { taskId: null, quality: 0.9 },
        ],
      })
    );

    const stats = await getAssignmentStats('a6', 'c6');

    expect(stats.teamsFormed).toBe(true);
    expect(stats.teamQuality).toBeDefined();
    // Task1 avg: 0.7
    // Unassigned avg: (0.8 + 0.9) / 2 = 0.85
    // So we have 2 task averages
    expect(stats.teamQuality?.count).toBe(2);
    expect(stats.teamQuality?.min).toBeCloseTo(0.7);
    expect(stats.teamQuality?.max).toBeCloseTo(0.85);
  });
});
