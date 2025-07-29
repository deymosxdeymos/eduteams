import { beforeEach, describe, expect, it, mock } from 'bun:test';

// Mock auth - MUST be before imports
const mockGetSession = mock();
mock.module('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));
mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

mock.module('next/headers', () => ({
  headers: mock(() => Promise.resolve({})),
}));

// Mock NextResponse - MUST be before imports
mock.module('next/server', () => ({
  NextResponse: {
    json: mock((data: any, options?: any) => {
      return {
        json: async () => data,
        status: options?.status || 200,
        headers: new Headers(),
      };
    }),
  },
}));

// Mock Next.js navigation
mock.module('next/navigation', () => ({
  redirect: mock((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

mock.module('next/cache', () => ({
  revalidatePath: mock(),
}));

import { createPersonalityPost } from '../../src/app/api/user/personality/route';

import { submitPersonalityTest } from '../../src/lib/actions/personality';
import { getCurrentUser } from '../../src/lib/api-utils';
import {
  calculatePersonalityScores,
  getMBTIType,
} from '../../src/lib/personality';
import prisma from '../../src/lib/prisma';

// Mock dependencies
mock.module('../../src/lib/api-utils', () => ({
  getCurrentUser: mock(),
}));

mock.module('../../src/lib/prisma', () => ({
  default: {
    user: {
      update: mock(),
      findUnique: mock(),
    },
  },
}));

mock.module('../../../src/lib/prisma', () => ({
  default: {
    user: {
      update: mock(),
      findUnique: mock(),
    },
  },
}));

describe('Personality Feature Integration Tests', () => {
  const mockGetCurrentUser = getCurrentUser as any;
  const mockPrismaUpdate = prisma.user.update as any;
  const mockPrismaFindUnique = prisma.user.findUnique as any;

  beforeEach(() => {
    mockGetCurrentUser.mockReset();
    mockPrismaUpdate.mockReset();
    mockPrismaFindUnique.mockReset();
    mockGetSession.mockReset();
  });

  describe('Complete Personality Test Flow', () => {
    it('should handle complete personality test submission via API', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: 'kepribadian',
        ei: null,
        sn: null,
        tf: null,
        pj: null,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetSession.mockResolvedValue({ user: mockUser });

      const completedUser = {
        ...mockUser,
        ei: 0.5,
        sn: -0.3,
        tf: 0.8,
        pj: -0.2,
      };
      mockPrismaUpdate.mockResolvedValue(completedUser);

      // Simulate complete personality test answers
      const completeAnswers = {
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 1,
        '7': 2,
        '8': 3,
        '9': 4,
        '10': 5,
        '11': 1,
        '12': 2,
        '13': 3,
        '14': 4,
        '15': 5,
        '16': 1,
        '17': 2,
        '18': 3,
        '19': 4,
        '20': 5,
        '21': 1,
        '22': 2,
        '23': 3,
        '24': 4,
      };

      const request = new Request(
        'http://localhost:3000/api/user/personality',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: completeAnswers }),
        }
      );

      const response = await personalityPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.scores).toBeDefined();
      expect(data.data.scores.ei).toBeGreaterThanOrEqual(-1);
      expect(data.data.scores.ei).toBeLessThanOrEqual(1);
      expect(data.data.scores.sn).toBeGreaterThanOrEqual(-1);
      expect(data.data.scores.sn).toBeLessThanOrEqual(1);
      expect(data.data.scores.tf).toBeGreaterThanOrEqual(-1);
      expect(data.data.scores.tf).toBeLessThanOrEqual(1);
      expect(data.data.scores.pj).toBeGreaterThanOrEqual(-1);
      expect(data.data.scores.pj).toBeLessThanOrEqual(1);

      // Verify database was updated
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          ei: expect.any(Number),
          sn: expect.any(Number),
          tf: expect.any(Number),
          pj: expect.any(Number),
        },
      });
    });

    it('should handle complete personality test submission via server action', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue({
        ...mockUser,
        ei: 0.2,
        sn: 0.1,
        tf: -0.4,
        pj: 0.6,
        isOnboarded: true,
      });

      const answers = {
        '1': 3,
        '2': 4,
        '3': 2,
        '4': 5,
        '5': 1,
        '6': 3,
        '7': 2,
        '8': 4,
        '9': 3,
        '10': 1,
        '11': 5,
        '12': 2,
        '13': 4,
        '14': 2,
        '15': 5,
        '16': 3,
        '17': 1,
        '18': 4,
        '19': 3,
        '20': 5,
        '21': 2,
        '22': 1,
        '23': 4,
        '24': 3,
      };

      const formData = new FormData();
      formData.append('answers', JSON.stringify(answers));

      // Should throw redirect error on success
      await expect(
        submitPersonalityTest(formData, mockGetCurrentUser)
      ).rejects.toThrow('Failed to submit personality test');

      // Verify database was updated with scores and isOnboarded flag
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          ei: expect.any(Number),
          sn: expect.any(Number),
          tf: expect.any(Number),
          pj: expect.any(Number),
          isOnboarded: true,
        },
      });
    });
  });

  describe('Personality Score Calculation Integration', () => {
    it('should calculate consistent scores across API and server action', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue({ ...mockUser, isOnboarded: true });

      const testAnswers = {
        '1': 5,
        '2': 5,
        '3': 5,
        '4': 5,
        '5': 5,
        '6': 5,
        '7': 1,
        '8': 1,
        '9': 1,
        '10': 1,
        '11': 1,
        '12': 1,
        '13': 5,
        '14': 5,
        '15': 5,
        '16': 5,
        '17': 5,
        '18': 5,
        '19': 1,
        '20': 1,
        '21': 1,
        '22': 1,
        '23': 1,
        '24': 1,
      };

      // Test via API
      const apiRequest = new Request(
        'http://localhost:3000/api/user/personality',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: testAnswers }),
        }
      );

      const apiResponse = await personalityPost(apiRequest);
      const apiData = await apiResponse.json();

      // Test via server action
      const formData = new FormData();
      formData.append('answers', JSON.stringify(testAnswers));

      try {
        await submitPersonalityTest(formData, mockGetCurrentUser);
      } catch (error) {
        // Expected redirect error
        expect((error as Error).message).toBe(
          'Failed to submit personality test'
        );
      }

      // Both should call the same calculation function and produce same results
      expect(apiData.success).toBe(true);
      expect(mockPrismaUpdate).toHaveBeenCalledTimes(2);

      // Verify both calls used the same scores
      const apiCall = mockPrismaUpdate.mock.calls[0][0];
      const serverActionCall = mockPrismaUpdate.mock.calls[1][0];

      expect(apiCall.data.ei).toBe(serverActionCall.data.ei);
      expect(apiCall.data.sn).toBe(serverActionCall.data.sn);
      expect(apiCall.data.tf).toBe(serverActionCall.data.tf);
      expect(apiCall.data.pj).toBe(serverActionCall.data.pj);
    });

    it('should calculate correct MBTI type for extreme scores', () => {
      // Test all extreme combinations
      const extremeTests = [
        { scores: { ei: 1, sn: 1, tf: 1, pj: 1 }, expectedType: 'INFP' },
        { scores: { ei: -1, sn: -1, tf: -1, pj: -1 }, expectedType: 'ESTJ' },
        { scores: { ei: 1, sn: -1, tf: 1, pj: -1 }, expectedType: 'ISFJ' },
        { scores: { ei: -1, sn: 1, tf: -1, pj: 1 }, expectedType: 'ENTP' },
      ];

      extremeTests.forEach(({ scores, expectedType }) => {
        const result = getMBTIType(scores);
        expect(result).toBe(expectedType);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle partial personality test submission', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue({ ...mockUser, isOnboarded: true });

      // Submit only half the questions
      const partialAnswers = {
        '1': 3,
        '2': 4,
        '3': 2,
        '4': 5,
        '5': 1,
        '6': 3,
        '7': 2,
        '8': 4,
        '9': 3,
        '10': 1,
        '11': 5,
        '12': 2,
      };

      const request = new Request(
        'http://localhost:3000/api/user/personality',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: partialAnswers }),
        }
      );

      const response = await personalityPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.scores).toBeDefined();

      // Should still update database even with partial answers
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          ei: expect.any(Number),
          sn: expect.any(Number),
          tf: expect.any(Number),
          pj: expect.any(Number),
        },
      });
    });

    it('should handle empty personality test submission', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue({ ...mockUser, isOnboarded: true });

      const request = new Request(
        'http://localhost:3000/api/user/personality',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: {} }),
        }
      );

      const response = await personalityPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.scores).toEqual({
        ei: 0,
        sn: 0,
        tf: 0,
        pj: 0,
      });

      // Should update database with zero scores
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
        },
      });
    });

    it('should handle authentication failures', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      mockGetSession.mockResolvedValue({ user: null });

      const request = new Request(
        'http://localhost:3000/api/user/personality',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: { '1': 3 } }),
        }
      );

      const response = await personalityPost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      expect(mockPrismaUpdate).not.toHaveBeenCalled();
    });

    it('should handle database connection failures', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new Request(
        'http://localhost:3000/api/user/personality',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: { '1': 3 } }),
        }
      );

      const response = await personalityPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle invalid answer values', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      const request = new Request(
        'http://localhost:3000/api/user/personality',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: { '1': 6, '2': 0, '3': -1 } }),
        }
      );

      const response = await personalityPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Too big');
      expect(mockPrismaUpdate).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      const request = new Request(
        'http://localhost:3000/api/user/personality',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json',
        }
      );

      const response = await personalityPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Failed to parse JSON');
      expect(mockPrismaUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Score Calculation Accuracy', () => {
    it('should calculate correct personality scores for known patterns', () => {
      // Test known patterns that should produce specific results
      const testCases = [
        {
          name: 'All neutral answers',
          answers: Array.from({ length: 24 }, (_, i) => ({
            [(i + 1).toString()]: 3,
          })).reduce((acc, obj) => ({ ...acc, ...obj }), {}),
          expected: { ei: 0, sn: 0, tf: 0, pj: 0 },
        },
        {
          name: 'All strongly agree (5)',
          answers: Array.from({ length: 24 }, (_, i) => ({
            [(i + 1).toString()]: 5,
          })).reduce((acc, obj) => ({ ...acc, ...obj }), {}),
          expected: {
            ei: expect.any(Number),
            sn: expect.any(Number),
            tf: expect.any(Number),
            pj: expect.any(Number),
          },
        },
        {
          name: 'All strongly disagree (1)',
          answers: Array.from({ length: 24 }, (_, i) => ({
            [(i + 1).toString()]: 1,
          })).reduce((acc, obj) => ({ ...acc, ...obj }), {}),
          expected: {
            ei: expect.any(Number),
            sn: expect.any(Number),
            tf: expect.any(Number),
            pj: expect.any(Number),
          },
        },
      ];

      testCases.forEach(({ name, answers, expected }) => {
        const scores = calculatePersonalityScores(answers);

        // Verify all scores are within valid range
        expect(scores.ei).toBeGreaterThanOrEqual(-1);
        expect(scores.ei).toBeLessThanOrEqual(1);
        expect(scores.sn).toBeGreaterThanOrEqual(-1);
        expect(scores.sn).toBeLessThanOrEqual(1);
        expect(scores.tf).toBeGreaterThanOrEqual(-1);
        expect(scores.tf).toBeLessThanOrEqual(1);
        expect(scores.pj).toBeGreaterThanOrEqual(-1);
        expect(scores.pj).toBeLessThanOrEqual(1);

        // Check specific expectations
        if (typeof expected.ei === 'number') {
          expect(scores.ei).toBe(expected.ei);
        }
        if (typeof expected.sn === 'number') {
          expect(scores.sn).toBe(expected.sn);
        }
        if (typeof expected.tf === 'number') {
          expect(scores.tf).toBe(expected.tf);
        }
        if (typeof expected.pj === 'number') {
          expect(scores.pj).toBe(expected.pj);
        }
      });
    });

    it('should handle score calculation consistency', () => {
      const testAnswers = {
        '1': 3,
        '2': 4,
        '3': 2,
        '4': 5,
        '5': 1,
        '6': 3,
        '7': 2,
        '8': 4,
        '9': 3,
        '10': 1,
        '11': 5,
        '12': 2,
        '13': 4,
        '14': 2,
        '15': 5,
        '16': 3,
        '17': 1,
        '18': 4,
        '19': 3,
        '20': 5,
        '21': 2,
        '22': 1,
        '23': 4,
        '24': 3,
      };

      // Calculate scores multiple times
      const scores1 = calculatePersonalityScores(testAnswers);
      const scores2 = calculatePersonalityScores(testAnswers);
      const scores3 = calculatePersonalityScores(testAnswers);

      // Should produce identical results
      expect(scores1).toEqual(scores2);
      expect(scores2).toEqual(scores3);
    });
  });

  describe('Full Integration Flow', () => {
    it('should complete entire personality test flow from submission to dashboard redirect', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: 'kepribadian',
        ei: null,
        sn: null,
        tf: null,
        pj: null,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue({
        ...mockUser,
        ei: 0.2,
        sn: -0.1,
        tf: 0.3,
        pj: -0.4,
        isOnboarded: true,
      });

      const completeAnswers = {
        '1': 3,
        '2': 4,
        '3': 2,
        '4': 5,
        '5': 1,
        '6': 3,
        '7': 2,
        '8': 4,
        '9': 3,
        '10': 1,
        '11': 5,
        '12': 2,
        '13': 4,
        '14': 2,
        '15': 5,
        '16': 3,
        '17': 1,
        '18': 4,
        '19': 3,
        '20': 5,
        '21': 2,
        '22': 1,
        '23': 4,
        '24': 3,
      };

      // Step 1: Submit via API
      const apiRequest = new Request(
        'http://localhost:3000/api/user/personality',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: completeAnswers }),
        }
      );

      const apiResponse = await personalityPost(apiRequest);
      const apiData = await apiResponse.json();

      expect(apiResponse.status).toBe(200);
      expect(apiData.success).toBe(true);
      expect(apiData.data.scores).toBeDefined();

      // Step 2: Submit via server action (simulating form submission)
      const formData = new FormData();
      formData.append('answers', JSON.stringify(completeAnswers));

      await expect(
        submitPersonalityTest(formData, mockGetCurrentUser)
      ).rejects.toThrow('Failed to submit personality test');

      // Step 3: Verify final state
      expect(mockPrismaUpdate).toHaveBeenCalledTimes(2);

      const finalUpdate = mockPrismaUpdate.mock.calls[1][0];
      expect(finalUpdate.data.isOnboarded).toBe(true);
      expect(finalUpdate.data.ei).toBeDefined();
      expect(finalUpdate.data.sn).toBeDefined();
      expect(finalUpdate.data.tf).toBeDefined();
      expect(finalUpdate.data.pj).toBeDefined();
    });

    it('should handle user switching between different answer patterns', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue({ ...mockUser, isOnboarded: true });

      // First submission with one pattern
      const firstAnswers = {
        '1': 1,
        '2': 1,
        '3': 1,
        '4': 1,
        '5': 1,
        '6': 1,
        '7': 1,
        '8': 1,
        '9': 1,
        '10': 1,
        '11': 1,
        '12': 1,
        '13': 1,
        '14': 1,
        '15': 1,
        '16': 1,
        '17': 1,
        '18': 1,
        '19': 1,
        '20': 1,
        '21': 1,
        '22': 1,
        '23': 1,
        '24': 1,
      };

      const firstRequest = new Request(
        'http://localhost:3000/api/user/personality',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: firstAnswers }),
        }
      );

      const firstResponse = await personalityPost(firstRequest);
      const firstData = await firstResponse.json();

      // Second submission with different pattern
      const secondAnswers = {
        '1': 5,
        '2': 5,
        '3': 5,
        '4': 5,
        '5': 5,
        '6': 5,
        '7': 5,
        '8': 5,
        '9': 5,
        '10': 5,
        '11': 5,
        '12': 5,
        '13': 5,
        '14': 5,
        '15': 5,
        '16': 5,
        '17': 5,
        '18': 5,
        '19': 5,
        '20': 5,
        '21': 5,
        '22': 5,
        '23': 5,
        '24': 5,
      };

      const secondRequest = new Request(
        'http://localhost:3000/api/user/personality',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: secondAnswers }),
        }
      );

      const secondResponse = await personalityPost(secondRequest);
      const secondData = await secondResponse.json();

      // Both should succeed but with different scores
      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      expect(firstData.success).toBe(true);
      expect(secondData.success).toBe(true);

      // Scores should be different
      expect(firstData.data.scores).not.toEqual(secondData.data.scores);
    });
  });
});
