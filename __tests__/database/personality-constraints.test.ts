import {
  beforeEach,
  describe,
  expect,
  it,
} from 'bun:test';
import prisma from '../../src/lib/prisma';
import {
  calculateMBTIFromScores,
  DatabaseConstraintError,
  PersonalityValidationError,
  parseConstraintError,
  validateMBTIType,
  validatePersonalityCompleteness,
  validatePersonalityScores,
} from '../../src/lib/validation/personality-helpers';

describe('Database Constraint Validation', () => {
  let isDatabaseAvailable = false;

  // Setup database connectivity test before all tests
  beforeEach(async () => {
    // Test database connectivity for each test
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      isDatabaseAvailable = true;
    } catch (error) {
      console.warn('Database not available for constraint tests, skipping...');
      isDatabaseAvailable = false;
    }
    
    if (!isDatabaseAvailable) return;
    
    try {
      // Clean up in the correct order to avoid foreign key constraint violations
      await prisma.teamMember.deleteMany();
      await prisma.team.deleteMany();
      await prisma.teamFormationRequest.deleteMany();
      await prisma.skillSimilarity.deleteMany();
      await prisma.taskSkill.deleteMany();
      await prisma.taskPreference.deleteMany();
      await prisma.task.deleteMany();
      await prisma.personPreference.deleteMany();
      await prisma.personSkill.deleteMany();
      await prisma.skill.deleteMany();
      await prisma.user.deleteMany();
    } catch (error) {
      console.warn('Error during test cleanup:', error);
    }
  });

  describe('Personality Score Constraints', () => {
    it('should allow valid personality scores (-1.0 to 1.0)', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      const validScores = [
        { ei: -1.0, sn: 0.0, tf: 0.5, pj: 1.0 },
        { ei: -0.5, sn: 0.25, tf: -0.75, pj: 0.33 },
        { ei: 0.0, sn: 0.0, tf: 0.0, pj: 0.0 },
      ];

      for (const scores of validScores) {
        await expect(
          prisma.user.create({
            data: {
              id: `user-${Math.random()}`,
              name: 'Test User',
              email: `test-${Math.random()}@example.com`,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              ...scores,
            },
          })
        ).resolves.toBeDefined();
      }
    });

    it('should reject personality scores outside (-1.0 to 1.0) range', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      const invalidScores = [
        { ei: -1.1, sn: 0.0, tf: 0.0, pj: 0.0 },
        { ei: 0.0, sn: 1.1, tf: 0.0, pj: 0.0 },
        { ei: 0.0, sn: 0.0, tf: -1.1, pj: 0.0 },
        { ei: 0.0, sn: 0.0, tf: 0.0, pj: 1.1 },
        { ei: 2.0, sn: 0.0, tf: 0.0, pj: 0.0 },
        { ei: 0.0, sn: -2.0, tf: 0.0, pj: 0.0 },
      ];

      for (const scores of invalidScores) {
        await expect(
          prisma.user.create({
            data: {
              id: `user-${Math.random()}`,
              name: 'Test User',
              email: `test-${Math.random()}@example.com`,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              ...scores,
            },
          })
        ).rejects.toThrow();
      }
    });

    it('should enforce personality completeness constraint', async () => {
      const incompleteScores = [
        { ei: 0.5, sn: null, tf: null, pj: null },
        { ei: null, sn: 0.5, tf: null, pj: null },
        { ei: 0.5, sn: 0.5, tf: null, pj: null },
        { ei: 0.5, sn: 0.5, tf: 0.5, pj: null },
      ];

      for (const scores of incompleteScores) {
        await expect(
          prisma.user.create({
            data: {
              id: `user-${Math.random()}`,
              name: 'Test User',
              email: `test-${Math.random()}@example.com`,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              ...scores,
            },
          })
        ).rejects.toThrow();
      }
    });

    it('should allow all null personality scores', async () => {
      await expect(
        prisma.user.create({
          data: {
            id: `user-${Math.random()}`,
            name: 'Test User',
            email: `test-${Math.random()}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ei: null,
            sn: null,
            tf: null,
            pj: null,
          },
        })
      ).resolves.toBeDefined();
    });
  });

  describe('MBTI Type Constraints', () => {
    it('should allow valid MBTI types', async () => {
      const validTypes = [
        'ENFJ',
        'ENFP',
        'ENTJ',
        'ENTP',
        'ESFJ',
        'ESFP',
        'ESTJ',
        'ESTP',
        'INFJ',
        'INFP',
        'INTJ',
        'INTP',
        'ISFJ',
        'ISFP',
        'ISTJ',
        'ISTP',
      ];

      for (const mbtiType of validTypes) {
        await expect(
          prisma.user.create({
            data: {
              id: `user-${Math.random()}`,
              name: 'Test User',
              email: `test-${Math.random()}@example.com`,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              ei: 0.5,
              sn: 0.5,
              tf: 0.5,
              pj: 0.5,
              mbtiType,
            },
          })
        ).resolves.toBeDefined();
      }
    });

    it('should reject invalid MBTI types', async () => {
      const invalidTypes = ['INVALID', 'XXXX', 'ABCD', 'ENFX', 'INXJ', 'TEST'];

      for (const mbtiType of invalidTypes) {
        await expect(
          prisma.user.create({
            data: {
              id: `user-${Math.random()}`,
              name: 'Test User',
              email: `test-${Math.random()}@example.com`,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              ei: 0.5,
              sn: 0.5,
              tf: 0.5,
              pj: 0.5,
              mbtiType,
            },
          })
        ).rejects.toThrow();
      }
    });

    it('should enforce MBTI consistency constraint', async () => {
      await expect(
        prisma.user.create({
          data: {
            id: `user-${Math.random()}`,
            name: 'Test User',
            email: `test-${Math.random()}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            mbtiType: 'ENFJ',
            ei: null,
            sn: null,
            tf: null,
            pj: null,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Personality Data JSON Validation', () => {
    it('should allow valid personality data JSON', async () => {
      const validData = [
        { answers: { '1': 3, '2': 4, '3': 2 } },
        { scores: { ei: 0.5, sn: -0.3, tf: 0.8, pj: -0.1 } },
        {
          metadata: {
            testVersion: '1.0',
            completedAt: new Date().toISOString(),
          },
        },
        {
          answers: { '1': 3, '2': 4 },
          scores: { ei: 0.5, sn: -0.3, tf: 0.8, pj: -0.1 },
          metadata: { testVersion: '1.0' },
        },
      ];

      for (const personalityData of validData) {
        await expect(
          prisma.user.create({
            data: {
              id: `user-${Math.random()}`,
              name: 'Test User',
              email: `test-${Math.random()}@example.com`,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              personalityData,
            },
          })
        ).resolves.toBeDefined();
      }
    });

    it('should reject invalid personality data JSON', async () => {
      const invalidData = [null, 'string', 123, [], {}, { invalid: 'field' }];

      for (const personalityData of invalidData) {
        await expect(
          prisma.user.create({
            data: {
              id: `user-${Math.random()}`,
              name: 'Test User',
              email: `test-${Math.random()}@example.com`,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              personalityData,
            },
          })
        ).rejects.toThrow();
      }
    });
  });

  describe('Skill Level Constraints', () => {
    it('should allow valid skill levels (0.0 to 10.0)', async () => {
      const skill = await prisma.skill.create({
        data: {
          name: 'JavaScript',
          description: 'Programming language',
        },
      });

      const user = await prisma.user.create({
        data: {
          id: `user-${Math.random()}`,
          name: 'Test User',
          email: `test-${Math.random()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const validLevels = [0.0, 2.5, 5.0, 7.5, 10.0];

      const usedLevels = new Set();
      for (const level of validLevels) {
        if (usedLevels.has(level)) continue; // skip duplicate
        usedLevels.add(level);
        await expect(
          prisma.personSkill.create({
            data: {
              personId: user.id,
              skillId: skill.id,
              level,
            },
          })
        ).resolves.toBeDefined();
      }
    });

    it('should reject invalid skill levels', async () => {
      const skill = await prisma.skill.create({
        data: {
          name: 'JavaScript',
          description: 'Programming language',
        },
      });

      const user = await prisma.user.create({
        data: {
          id: `user-${Math.random()}`,
          name: 'Test User',
          email: `test-${Math.random()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const invalidLevels = [-0.1, 10.1, -5.0, 15.0];

      for (const level of invalidLevels) {
        await expect(
          prisma.personSkill.create({
            data: {
              personId: user.id,
              skillId: skill.id,
              level,
            },
          })
        ).rejects.toThrow();
      }
    });
  });

  describe('Preference Constraints', () => {
    it('should allow valid preferences (-1.0 to 1.0)', async () => {
      const users = await Promise.all([
        prisma.user.create({
          data: {
            id: `user-${Math.random()}`,
            name: 'Test User 1',
            email: `test-${Math.random()}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }),
        prisma.user.create({
          data: {
            id: `user-${Math.random()}`,
            name: 'Test User 2',
            email: `test-${Math.random()}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }),
      ]);

      const validPreferences = [-1.0, -0.5, 0.0, 0.5, 1.0];

      for (const preference of validPreferences) {
        await expect(
          prisma.personPreference.create({
            data: {
              personId: users[0].id,
              preferredPersonId: users[1].id,
              preference,
            },
          })
        ).resolves.toBeDefined();
      }
    });

    it('should reject invalid preferences', async () => {
      const users = await Promise.all([
        prisma.user.create({
          data: {
            id: `user-${Math.random()}`,
            name: 'Test User 1',
            email: `test-${Math.random()}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }),
        prisma.user.create({
          data: {
            id: `user-${Math.random()}`,
            name: 'Test User 2',
            email: `test-${Math.random()}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }),
      ]);

      const invalidPreferences = [-1.1, 1.1, -2.0, 2.0];

      for (const preference of invalidPreferences) {
        await expect(
          prisma.personPreference.create({
            data: {
              personId: users[0].id,
              preferredPersonId: users[1].id,
              preference,
            },
          })
        ).rejects.toThrow();
      }
    });

    it('should reject self-preferences', async () => {
      const user = await prisma.user.create({
        data: {
          id: `user-${Math.random()}`,
          name: 'Test User',
          email: `test-${Math.random()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await expect(
        prisma.personPreference.create({
          data: {
            personId: user.id,
            preferredPersonId: user.id,
            preference: 0.5,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Team Formation Request Constraints', () => {
    it('should allow valid alpha, beta, gamma, delta values (0.0 to 1.0)', async () => {
      const user = await prisma.user.create({
        data: {
          id: `user-${Math.random()}`,
          name: 'Test User',
          email: `test-${Math.random()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const validValues = [0.0, 0.25, 0.5, 0.75, 1.0];

      for (const value of validValues) {
        await expect(
          prisma.teamFormationRequest.create({
            data: {
              ownerId: user.id,
              alpha: value,
              beta: value,
              gamma: value,
              delta: value,
            },
          })
        ).resolves.toBeDefined();
      }
    });

    it('should reject invalid parameter values', async () => {
      const user = await prisma.user.create({
        data: {
          id: `user-${Math.random()}`,
          name: 'Test User',
          email: `test-${Math.random()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const invalidValues = [-0.1, 1.1, -1.0, 2.0];

      for (const value of invalidValues) {
        await expect(
          prisma.teamFormationRequest.create({
            data: {
              ownerId: user.id,
              alpha: value,
            },
          })
        ).rejects.toThrow();
      }
    });
  });

  describe('Team Quality Constraints', () => {
    it('should allow valid team quality values (0.0 to 1.0)', async () => {
      const user = await prisma.user.create({
        data: {
          id: `user-${Math.random()}`,
          name: 'Test User',
          email: `test-${Math.random()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const request = await prisma.teamFormationRequest.create({
        data: {
          ownerId: user.id,
        },
      });

      const validQualities = [0.0, 0.25, 0.5, 0.75, 1.0];

      for (const quality of validQualities) {
        await expect(
          prisma.team.create({
            data: {
              teamFormationRequestId: request.id,
              quality,
            },
          })
        ).resolves.toBeDefined();
      }
    });

    it('should reject invalid team quality values', async () => {
      const user = await prisma.user.create({
        data: {
          id: `user-${Math.random()}`,
          name: 'Test User',
          email: `test-${Math.random()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const request = await prisma.teamFormationRequest.create({
        data: {
          ownerId: user.id,
        },
      });

      const invalidQualities = [-0.1, 1.1, -1.0, 2.0];

      for (const quality of invalidQualities) {
        await expect(
          prisma.team.create({
            data: {
              teamFormationRequestId: request.id,
              quality,
            },
          })
        ).rejects.toThrow();
      }
    });
  });

  describe('Task Team Size Constraints', () => {
    it('should allow valid team sizes (positive integers)', async () => {
      const validSizes = [1, 2, 5, 10, 20, 50];

      for (const teamSize of validSizes) {
        await expect(
          prisma.task.create({
            data: {
              name: `Task ${teamSize}`,
              teamSize,
            },
          })
        ).resolves.toBeDefined();
      }
    });

    it('should reject invalid team sizes', async () => {
      const invalidSizes = [0, -1, -5];

      for (const teamSize of invalidSizes) {
        await expect(
          prisma.task.create({
            data: {
              name: `Task ${teamSize}`,
              teamSize,
            },
          })
        ).rejects.toThrow();
      }
    });
  });
});

describe('Validation Helper Functions', () => {
  describe('validatePersonalityScores', () => {
    it('should validate correct personality scores', () => {
      const validScores = { ei: 0.5, sn: -0.3, tf: 0.8, pj: -0.1 };
      expect(() => validatePersonalityScores(validScores)).not.toThrow();
    });

    it('should reject invalid personality scores', () => {
      const invalidScores = [
        { ei: 1.1, sn: 0.0, tf: 0.0, pj: 0.0 },
        { ei: 0.0, sn: -1.1, tf: 0.0, pj: 0.0 },
        { ei: 'invalid', sn: 0.0, tf: 0.0, pj: 0.0 },
        { ei: 0.0, sn: 0.0, tf: 0.0 },
      ];

      for (const scores of invalidScores) {
        expect(() => validatePersonalityScores(scores)).toThrow();
      }
    });
  });

  describe('validateMBTIType', () => {
    it('should validate correct MBTI types', () => {
      const validTypes = ['ENFJ', 'INTJ', 'ESFP', 'ISTP'];

      for (const type of validTypes) {
        expect(() => validateMBTIType(type)).not.toThrow();
      }
    });

    it('should reject invalid MBTI types', () => {
      const invalidTypes = ['INVALID', 'XXXX', 'ABCD', 'enfj', 123, null];

      for (const type of invalidTypes) {
        expect(() => validateMBTIType(type)).toThrow();
      }
    });
  });

  describe('calculateMBTIFromScores', () => {
    it('should calculate correct MBTI types from scores', () => {
      const testCases = [
        {
          scores: { ei: -0.1, sn: -0.1, tf: -0.1, pj: -0.1 },
          expected: 'ESTJ',
        },
        { scores: { ei: 0.1, sn: 0.1, tf: 0.1, pj: 0.1 }, expected: 'INFP' },
        { scores: { ei: -0.5, sn: 0.5, tf: -0.5, pj: 0.5 }, expected: 'ENTP' },
        { scores: { ei: 0.5, sn: -0.5, tf: 0.5, pj: -0.5 }, expected: 'ISFJ' },
      ];

      for (const { scores, expected } of testCases) {
        expect(calculateMBTIFromScores(scores)).toBe(expected);
      }
    });
  });

  describe('validatePersonalityCompleteness', () => {
    it('should allow complete personality data', () => {
      const completeData = {
        ei: 0.5,
        sn: -0.3,
        tf: 0.8,
        pj: -0.1,
        mbtiType: 'INFP',
      };

      expect(() => validatePersonalityCompleteness(completeData)).not.toThrow();
    });

    it('should allow all null personality data', () => {
      const nullData = {
        ei: null,
        sn: null,
        tf: null,
        pj: null,
        mbtiType: null,
      };

      expect(() => validatePersonalityCompleteness(nullData)).not.toThrow();
    });

    it('should reject incomplete personality data', () => {
      const incompleteData = [
        { ei: 0.5, sn: null, tf: null, pj: null },
        { ei: 0.5, sn: 0.5, tf: null, pj: null },
        { ei: 0.5, sn: 0.5, tf: 0.5, pj: null },
        { ei: null, sn: null, tf: null, pj: null, mbtiType: 'ENFJ' },
      ];

      for (const data of incompleteData) {
        expect(() => validatePersonalityCompleteness(data)).toThrow();
      }
    });
  });

  describe('parseConstraintError', () => {
    it('should parse personality constraint errors correctly', () => {
      const mockError = {
        code: '23514',
        message:
          'check constraint "user_ei_range_check" of relation "user" is violated by some row',
      };

      const parsed = parseConstraintError(mockError);
      expect(parsed).toBeInstanceOf(DatabaseConstraintError);
      expect(parsed?.constraintName).toBe('user_ei_range_check');
      expect(parsed?.table).toBe('user');
      expect(parsed?.field).toBe('ei');
    });

    it('should return null for non-constraint errors', () => {
      const mockError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      };

      const parsed = parseConstraintError(mockError);
      expect(parsed).toBeNull();
    });
  });
});
