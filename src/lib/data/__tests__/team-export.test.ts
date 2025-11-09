import { afterAll, describe, expect, it, mock } from 'bun:test';

const prismaMock = {
  assignment: {
    findFirst: mock(async () => null),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

afterAll(() => {
  prismaMock.assignment.findFirst.mockReset();
  mock.restore();
});

describe('getAssignmentExportData', () => {
  it('derives topic names from responseData taskIds', async () => {
    const assignment = {
      id: 'a1',
      title: 'Assignment 1',
      startAt: new Date('2024-01-01T00:00:00Z'),
      courseId: 'c1',
      course: {
        id: 'c1',
        namaMataKuliah: 'Course 101',
        kelas: 'A',
        dosen: { name: 'Dr. Dosen' },
      },
      AssignmentTopic: [
        { id: 'topic-1', name: 'Topic One' },
        { id: 'topic-2', name: 'Topic Two' },
      ],
      teamFormationRequests: [
        {
          id: 'tfr1',
          completedAt: new Date('2024-01-02T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          responseData: {
            teams: [{ taskId: 'topic-1-1' }, { taskId: 'topic-2-2' }],
          },
          teams: [
            {
              id: 'team-1',
              name: 'Team Alpha',
              quality: 0.8,
              taskId: null,
              members: [
                {
                  id: 'member-1',
                  userId: 'student-1',
                  assignedSkillIds: ['skill-1'],
                  user: {
                    id: 'student-1',
                    name: 'Student One',
                    email: 'student1@example.com',
                    nim: '001',
                    mbtiType: 'INTJ',
                    gender: 'MALE',
                    ei: null,
                    sn: null,
                    tf: null,
                    pj: null,
                    personSkills: [
                      {
                        skillId: 'skill-1',
                        level: 3,
                        skill: { id: 'skill-1', name: 'Skill One' },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    prismaMock.assignment.findFirst.mockResolvedValueOnce(assignment);

    const { getAssignmentExportData } = await import('../team-export');
    const result = await getAssignmentExportData('a1', 'owner-1');

    expect(result).not.toBeNull();
    expect(result?.teams[0]?.topicName).toBe('Topic One');
  });
});
