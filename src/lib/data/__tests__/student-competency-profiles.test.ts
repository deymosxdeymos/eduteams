import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { CompetencyKind } from '@/generated/prisma/client';
import {
  getStudentCompetencyPrefills,
  normalizeTopicKey,
} from '../student-competency-profiles';

const mockPrisma = {
  skill: {
    findMany: mock(() => Promise.resolve([])),
  },
  studentCompetencyProfile: {
    findMany: mock(() => Promise.resolve([])),
  },
  personSkill: {
    findMany: mock(() => Promise.resolve([])),
  },
};

mock.module('@/lib/prisma', () => ({
  default: mockPrisma,
}));

describe('normalizeTopicKey', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeTopicKey('  React  ')).toBe('react');
  });

  it('converts to lowercase', () => {
    expect(normalizeTopicKey('JavaScript')).toBe('javascript');
    expect(normalizeTopicKey('REACT')).toBe('react');
    expect(normalizeTopicKey('TypeScript')).toBe('typescript');
  });

  it('collapses multiple spaces to single space', () => {
    expect(normalizeTopicKey('Machine   Learning')).toBe('machine learning');
    expect(normalizeTopicKey('a    b     c')).toBe('a b c');
  });

  it('handles tabs and newlines as spaces', () => {
    expect(normalizeTopicKey('React\tNative')).toBe('react native');
    expect(normalizeTopicKey('Next\nJS')).toBe('next js');
  });

  it('truncates to 256 characters', () => {
    const longName = 'a'.repeat(300);
    const result = normalizeTopicKey(longName);
    expect(result.length).toBe(256);
  });

  it('handles empty string', () => {
    expect(normalizeTopicKey('')).toBe('');
  });

  it('handles string with only whitespace', () => {
    expect(normalizeTopicKey('   ')).toBe('');
  });

  it('preserves special characters', () => {
    expect(normalizeTopicKey('C++')).toBe('c++');
    expect(normalizeTopicKey('C#')).toBe('c#');
    expect(normalizeTopicKey('Node.js')).toBe('node.js');
  });

  it('handles unicode characters', () => {
    expect(normalizeTopicKey('日本語')).toBe('日本語');
    expect(normalizeTopicKey('Español')).toBe('español');
  });

  it('handles mixed case with multiple words', () => {
    expect(normalizeTopicKey('React Native Development')).toBe(
      'react native development'
    );
  });
});

describe('getStudentCompetencyPrefills', () => {
  beforeEach(() => {
    mockPrisma.skill.findMany.mockClear();
    mockPrisma.studentCompetencyProfile.findMany.mockClear();
    mockPrisma.personSkill.findMany.mockClear();

    mockPrisma.skill.findMany.mockResolvedValue([]);
    mockPrisma.studentCompetencyProfile.findMany.mockResolvedValue([]);
    mockPrisma.personSkill.findMany.mockResolvedValue([]);
  });

  describe('empty inputs', () => {
    it('returns empty arrays when no skills or topics provided', async () => {
      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: [],
        topicNames: [],
      });

      expect(result.skills).toEqual([]);
      expect(result.topics).toEqual([]);
      expect(mockPrisma.skill.findMany).not.toHaveBeenCalled();
      expect(
        mockPrisma.studentCompetencyProfile.findMany
      ).not.toHaveBeenCalled();
    });

    it('handles only skill names', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([
        { id: 'skill-1', name: 'JavaScript' },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['JavaScript'],
        topicNames: [],
      });

      expect(result.skills).toHaveLength(1);
      expect(result.topics).toEqual([]);
    });

    it('handles only topic names', async () => {
      mockPrisma.studentCompetencyProfile.findMany.mockResolvedValueOnce([
        {
          id: 'profile-1',
          topicKey: 'react',
          value: 3,
          updatedAt: new Date('2024-01-01'),
          sourceAssignmentId: null,
        },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: [],
        topicNames: ['React'],
      });

      expect(result.skills).toEqual([]);
      expect(result.topics).toHaveLength(1);
      expect(result.topics[0].preference).toBe(3);
    });
  });

  describe('skill prefills', () => {
    it('returns skill with level from competency profile', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([
        { id: 'skill-1', name: 'JavaScript' },
      ]);
      mockPrisma.studentCompetencyProfile.findMany.mockResolvedValueOnce([
        {
          id: 'profile-1',
          skillId: 'skill-1',
          value: 4,
          updatedAt: new Date('2024-01-15'),
          sourceAssignmentId: 'assignment-1',
        },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['JavaScript'],
        topicNames: [],
      });

      expect(result.skills).toEqual([
        {
          name: 'JavaScript',
          level: 4,
          profileId: 'profile-1',
          profileUpdatedAt: new Date('2024-01-15'),
          sourceAssignmentId: 'assignment-1',
        },
      ]);
    });

    it('falls back to personSkill when no competency profile exists', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([
        { id: 'skill-1', name: 'JavaScript' },
      ]);
      mockPrisma.studentCompetencyProfile.findMany.mockResolvedValueOnce([]);
      mockPrisma.personSkill.findMany.mockResolvedValueOnce([
        {
          skillId: 'skill-1',
          level: 3,
          updatedAt: new Date('2024-01-10'),
        },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['JavaScript'],
        topicNames: [],
      });

      expect(result.skills[0].level).toBe(3);
      expect(result.skills[0].profileId).toBeNull();
      expect(result.skills[0].profileUpdatedAt).toBeNull();
    });

    it('prefers competency profile over personSkill', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([
        { id: 'skill-1', name: 'JavaScript' },
      ]);
      mockPrisma.studentCompetencyProfile.findMany.mockResolvedValueOnce([
        {
          id: 'profile-1',
          skillId: 'skill-1',
          value: 5,
          updatedAt: new Date('2024-01-20'),
          sourceAssignmentId: null,
        },
      ]);
      mockPrisma.personSkill.findMany.mockResolvedValueOnce([
        {
          skillId: 'skill-1',
          level: 2,
          updatedAt: new Date('2024-01-01'),
        },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['JavaScript'],
        topicNames: [],
      });

      expect(result.skills[0].level).toBe(5);
    });

    it('returns null level when skill not found in database', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['UnknownSkill'],
        topicNames: [],
      });

      expect(result.skills).toEqual([
        {
          name: 'UnknownSkill',
          level: null,
          profileId: null,
          profileUpdatedAt: null,
          sourceAssignmentId: null,
        },
      ]);
    });

    it('handles multiple skills with mixed data availability', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([
        { id: 'skill-1', name: 'JavaScript' },
        { id: 'skill-2', name: 'TypeScript' },
      ]);
      mockPrisma.studentCompetencyProfile.findMany.mockResolvedValueOnce([
        {
          id: 'profile-1',
          skillId: 'skill-1',
          value: 4,
          updatedAt: new Date('2024-01-15'),
          sourceAssignmentId: null,
        },
      ]);
      mockPrisma.personSkill.findMany.mockResolvedValueOnce([
        {
          skillId: 'skill-2',
          level: 2,
          updatedAt: new Date('2024-01-10'),
        },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['JavaScript', 'TypeScript', 'Python'],
        topicNames: [],
      });

      expect(result.skills).toHaveLength(3);
      expect(result.skills[0]).toEqual({
        name: 'JavaScript',
        level: 4,
        profileId: 'profile-1',
        profileUpdatedAt: new Date('2024-01-15'),
        sourceAssignmentId: null,
      });
      expect(result.skills[1]).toEqual({
        name: 'TypeScript',
        level: 2,
        profileId: null,
        profileUpdatedAt: null,
        sourceAssignmentId: null,
      });
      expect(result.skills[2]).toEqual({
        name: 'Python',
        level: null,
        profileId: null,
        profileUpdatedAt: null,
        sourceAssignmentId: null,
      });
    });
  });

  describe('topic prefills', () => {
    it('returns topic with preference from competency profile', async () => {
      mockPrisma.studentCompetencyProfile.findMany.mockResolvedValueOnce([
        {
          id: 'profile-1',
          topicKey: 'machine learning',
          value: 5,
          updatedAt: new Date('2024-01-20'),
          sourceAssignmentId: 'assignment-2',
        },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: [],
        topicNames: ['Machine Learning'],
      });

      expect(result.topics).toEqual([
        {
          name: 'Machine Learning',
          preference: 5,
          profileId: 'profile-1',
          profileUpdatedAt: new Date('2024-01-20'),
          sourceAssignmentId: 'assignment-2',
        },
      ]);
    });

    it('returns null preference when topic not found', async () => {
      mockPrisma.studentCompetencyProfile.findMany.mockResolvedValueOnce([]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: [],
        topicNames: ['Unknown Topic'],
      });

      expect(result.topics).toEqual([
        {
          name: 'Unknown Topic',
          preference: null,
          profileId: null,
          profileUpdatedAt: null,
          sourceAssignmentId: null,
        },
      ]);
    });

    it('matches topics case-insensitively', async () => {
      mockPrisma.studentCompetencyProfile.findMany.mockResolvedValueOnce([
        {
          id: 'profile-1',
          topicKey: 'react native',
          value: 4,
          updatedAt: new Date('2024-01-15'),
          sourceAssignmentId: null,
        },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: [],
        topicNames: ['React Native'],
      });

      expect(result.topics[0].preference).toBe(4);
    });

    it('handles whitespace in topic names', async () => {
      mockPrisma.studentCompetencyProfile.findMany.mockResolvedValueOnce([
        {
          id: 'profile-1',
          topicKey: 'deep learning',
          value: 3,
          updatedAt: new Date('2024-01-10'),
          sourceAssignmentId: null,
        },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: [],
        topicNames: ['  Deep   Learning  '],
      });

      expect(result.topics[0].preference).toBe(3);
    });
  });

  describe('edge cases and deduplication', () => {
    it('trims skill names', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([
        { id: 'skill-1', name: 'JavaScript' },
      ]);

      await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['  JavaScript  '],
        topicNames: [],
      });

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
        where: { name: { in: ['JavaScript'] } },
        select: { id: true, name: true },
      });
    });

    it('filters empty skill names after trim', async () => {
      await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['JavaScript', '   ', '', 'TypeScript'],
        topicNames: [],
      });

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
        where: { name: { in: ['JavaScript', 'TypeScript'] } },
        select: { id: true, name: true },
      });
    });

    it('filters empty topic names', async () => {
      await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: [],
        topicNames: ['React', '   ', '', 'Vue'],
      });

      expect(mockPrisma.studentCompetencyProfile.findMany).toHaveBeenCalledWith(
        {
          where: {
            studentId: 'student-1',
            competencyKind: CompetencyKind.TOPIC,
            topicKey: { in: ['react', 'vue'] },
          },
          select: {
            id: true,
            topicKey: true,
            value: true,
            updatedAt: true,
            sourceAssignmentId: true,
          },
        }
      );
    });

    it('deduplicates skill names for database query', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([
        { id: 'skill-1', name: 'JavaScript' },
      ]);

      await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['JavaScript', 'JavaScript', 'JavaScript'],
        topicNames: [],
      });

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
        where: { name: { in: ['JavaScript'] } },
        select: { id: true, name: true },
      });
    });

    it('deduplicates skill names in output', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([
        { id: 'skill-1', name: 'JavaScript' },
      ]);
      mockPrisma.studentCompetencyProfile.findMany.mockResolvedValueOnce([
        {
          id: 'profile-1',
          skillId: 'skill-1',
          value: 4,
          updatedAt: new Date('2024-01-15'),
          sourceAssignmentId: null,
        },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['JavaScript', 'JavaScript'],
        topicNames: [],
      });

      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe('JavaScript');
      expect(result.skills[0].level).toBe(4);
    });

    it('deduplicates topic keys for database query', async () => {
      await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: [],
        topicNames: ['React', 'REACT', 'react'],
      });

      expect(mockPrisma.studentCompetencyProfile.findMany).toHaveBeenCalledWith(
        {
          where: {
            studentId: 'student-1',
            competencyKind: CompetencyKind.TOPIC,
            topicKey: { in: ['react'] },
          },
          select: expect.any(Object),
        }
      );
    });

    it('deduplicates topic names in output (keeps first occurrence)', async () => {
      mockPrisma.studentCompetencyProfile.findMany.mockResolvedValueOnce([
        {
          id: 'profile-1',
          topicKey: 'react',
          value: 5,
          updatedAt: new Date('2024-01-15'),
          sourceAssignmentId: null,
        },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: [],
        topicNames: ['React', 'REACT', 'react'],
      });

      expect(result.topics).toHaveLength(1);
      expect(result.topics[0].name).toBe('React');
      expect(result.topics[0].preference).toBe(5);
    });
  });

  describe('database query correctness', () => {
    it('uses correct competency kind for skill profiles', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([
        { id: 'skill-1', name: 'JavaScript' },
      ]);

      await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['JavaScript'],
        topicNames: [],
      });

      expect(mockPrisma.studentCompetencyProfile.findMany).toHaveBeenCalledWith(
        {
          where: {
            studentId: 'student-1',
            competencyKind: CompetencyKind.SKILL,
            skillId: { in: ['skill-1'] },
          },
          select: {
            id: true,
            skillId: true,
            value: true,
            updatedAt: true,
            sourceAssignmentId: true,
          },
        }
      );
    });

    it('uses correct competency kind for topic profiles', async () => {
      await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: [],
        topicNames: ['Machine Learning'],
      });

      expect(mockPrisma.studentCompetencyProfile.findMany).toHaveBeenCalledWith(
        {
          where: {
            studentId: 'student-1',
            competencyKind: CompetencyKind.TOPIC,
            topicKey: { in: ['machine learning'] },
          },
          select: {
            id: true,
            topicKey: true,
            value: true,
            updatedAt: true,
            sourceAssignmentId: true,
          },
        }
      );
    });

    it('queries personSkill with correct studentId', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([
        { id: 'skill-1', name: 'JavaScript' },
      ]);

      await getStudentCompetencyPrefills({
        studentId: 'student-xyz',
        skillNames: ['JavaScript'],
        topicNames: [],
      });

      expect(mockPrisma.personSkill.findMany).toHaveBeenCalledWith({
        where: {
          personId: 'student-xyz',
          skillId: { in: ['skill-1'] },
        },
        select: { skillId: true, level: true, updatedAt: true },
      });
    });
  });

  describe('combined skills and topics', () => {
    it('handles both skills and topics in single call', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([
        { id: 'skill-1', name: 'JavaScript' },
        { id: 'skill-2', name: 'Python' },
      ]);
      mockPrisma.studentCompetencyProfile.findMany
        .mockResolvedValueOnce([
          {
            id: 'profile-1',
            skillId: 'skill-1',
            value: 4,
            updatedAt: new Date('2024-01-15'),
            sourceAssignmentId: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'profile-2',
            topicKey: 'machine learning',
            value: 5,
            updatedAt: new Date('2024-01-20'),
            sourceAssignmentId: 'assignment-1',
          },
        ]);
      mockPrisma.personSkill.findMany.mockResolvedValueOnce([
        { skillId: 'skill-2', level: 3, updatedAt: new Date('2024-01-10') },
      ]);

      const result = await getStudentCompetencyPrefills({
        studentId: 'student-1',
        skillNames: ['JavaScript', 'Python'],
        topicNames: ['Machine Learning', 'Deep Learning'],
      });

      expect(result.skills).toHaveLength(2);
      expect(result.skills[0].level).toBe(4);
      expect(result.skills[1].level).toBe(3);

      expect(result.topics).toHaveLength(2);
      expect(result.topics[0].preference).toBe(5);
      expect(result.topics[1].preference).toBeNull();
    });
  });
});
