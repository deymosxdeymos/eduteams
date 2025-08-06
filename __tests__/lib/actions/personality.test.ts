import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { submitPersonalityTest } from '../../../src/lib/actions/personality';
import { AuthError, ValidationError } from '../../../src/lib/types';

// Mock dependencies
const mockGetCurrentUser = mock();
const mockPrismaUpdate = mock();
const mockCalculatePersonalityScores = mock();
const mockRevalidatePath = mock();
const mockRedirect = mock();

mock.module('../../../src/lib/api-utils', () => ({
  getCurrentUser: mockGetCurrentUser,
}));

mock.module('../../../src/lib/prisma', () => ({
  default: {
    user: {
      update: mockPrismaUpdate,
    },
  },
}));

mock.module('../../../src/lib/personality', () => ({
  calculatePersonalityScores: mockCalculatePersonalityScores,
}));

mock.module('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}));

mock.module('next/navigation', () => ({
  redirect: mockRedirect,
}));

describe('submitPersonalityTest Server Action', () => {
  const mockUser = { id: 'user123' };
  const mockScores = {
    ei: 0.5,
    sn: -0.3,
    tf: 0.8,
    pj: -0.2,
  };

  beforeEach(() => {
    mockGetCurrentUser.mockReset();
    mockCalculatePersonalityScores.mockReset();
    mockPrismaUpdate.mockReset();
    mockRevalidatePath.mockReset();
    mockRedirect.mockReset();

    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockCalculatePersonalityScores.mockReturnValue(mockScores);
    mockPrismaUpdate.mockResolvedValue({});
    mockRevalidatePath.mockImplementation(() => {});
    mockRedirect.mockImplementation(() => {
      throw new Error('REDIRECT'); // Simulate redirect behavior
    });
  });

  describe('Authentication', () => {
    test('should throw AuthError when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const formData = new FormData();
      formData.append('answers', JSON.stringify({ '1': 3, '2': 4 }));

      await expect(submitPersonalityTest(formData)).rejects.toThrow(AuthError);
      await expect(submitPersonalityTest(formData)).rejects.toThrow(
        'Authentication required'
      );
    });

    test('should process request for authenticated user', async () => {
      const formData = new FormData();
      formData.append('answers', JSON.stringify({ '1': 3, '2': 4 }));

      await expect(submitPersonalityTest(formData)).rejects.toThrow('REDIRECT');

      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          ei: 0.5,
          sn: -0.3,
          tf: 0.8,
          pj: -0.2,
          isOnboarded: true,
        },
      });
    });
  });

  describe('Input Validation', () => {
    test('should throw ValidationError when answers are missing', async () => {
      const formData = new FormData();

      await expect(submitPersonalityTest(formData)).rejects.toThrow(
        ValidationError
      );
      await expect(submitPersonalityTest(formData)).rejects.toThrow(
        'Answers are required'
      );
    });

    test('should throw error for invalid JSON in answers', async () => {
      const formData = new FormData();
      formData.append('answers', 'invalid json');

      await expect(submitPersonalityTest(formData)).rejects.toThrow(
        'Failed to submit personality test'
      );
    });

    test('should validate answer values are within range', async () => {
      const formData = new FormData();
      formData.append('answers', JSON.stringify({ '1': 6, '2': 0 }));

      await expect(submitPersonalityTest(formData)).rejects.toThrow(
        'Failed to submit personality test'
      );
    });

    test('should accept valid answer format', async () => {
      const formData = new FormData();
      formData.append('answers', JSON.stringify({ '1': 1, '2': 2, '3': 3 }));

      await expect(submitPersonalityTest(formData)).rejects.toThrow('REDIRECT');

      expect(mockCalculatePersonalityScores).toHaveBeenCalledWith({
        1: 1,
        2: 2,
        3: 3,
      });
    });

    test('should handle empty answers object', async () => {
      const formData = new FormData();
      formData.append('answers', JSON.stringify({}));

      await expect(submitPersonalityTest(formData)).rejects.toThrow('REDIRECT');

      expect(mockCalculatePersonalityScores).toHaveBeenCalledWith({});
    });
  });

  describe('Score Calculation and Storage', () => {
    test('should calculate scores and update user data', async () => {
      const testAnswers = {
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
      };

      const formData = new FormData();
      formData.append('answers', JSON.stringify(testAnswers));

      await expect(submitPersonalityTest(formData)).rejects.toThrow('REDIRECT');

      expect(mockCalculatePersonalityScores).toHaveBeenCalledWith({
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
      });

      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          ei: 0.5,
          sn: -0.3,
          tf: 0.8,
          pj: -0.2,
          isOnboarded: true,
        },
      });
    });

    test('should set isOnboarded to true after successful submission', async () => {
      const formData = new FormData();
      formData.append('answers', JSON.stringify({ '1': 3 }));

      await expect(submitPersonalityTest(formData)).rejects.toThrow('REDIRECT');

      expect(mockPrismaUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isOnboarded: true,
          }),
        })
      );
    });
  });

  describe('Cache and Navigation', () => {
    test('should revalidate dashboard path after successful submission', async () => {
      const formData = new FormData();
      formData.append('answers', JSON.stringify({ '1': 3 }));

      await expect(submitPersonalityTest(formData)).rejects.toThrow('REDIRECT');

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
    });

    test('should redirect to dashboard after successful submission', async () => {
      const formData = new FormData();
      formData.append('answers', JSON.stringify({ '1': 3 }));

      await expect(submitPersonalityTest(formData)).rejects.toThrow('REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      mockPrismaUpdate.mockRejectedValue(
        new Error('Database connection failed')
      );

      const formData = new FormData();
      formData.append('answers', JSON.stringify({ '1': 3 }));

      await expect(submitPersonalityTest(formData)).rejects.toThrow(
        'Failed to submit personality test'
      );
    });

    test('should handle calculation errors gracefully', async () => {
      mockCalculatePersonalityScores.mockImplementation(() => {
        throw new Error('Calculation failed');
      });

      const formData = new FormData();
      formData.append('answers', JSON.stringify({ '1': 3 }));

      await expect(submitPersonalityTest(formData)).rejects.toThrow(
        'Failed to submit personality test'
      );
    });

    test('should preserve AuthError and ValidationError types', async () => {
      mockGetCurrentUser.mockRejectedValue(new AuthError('Session expired'));

      const formData = new FormData();
      formData.append('answers', JSON.stringify({ '1': 3 }));

      await expect(submitPersonalityTest(formData)).rejects.toThrow(AuthError);
      await expect(submitPersonalityTest(formData)).rejects.toThrow(
        'Session expired'
      );
    });

    test('should convert generic errors to generic message', async () => {
      mockPrismaUpdate.mockRejectedValue(new TypeError('Unexpected error'));

      const formData = new FormData();
      formData.append('answers', JSON.stringify({ '1': 3 }));

      await expect(submitPersonalityTest(formData)).rejects.toThrow(
        'Failed to submit personality test'
      );
    });
  });

  describe('Data Transformation', () => {
    test('should convert string keys to numeric keys', async () => {
      const formData = new FormData();
      formData.append(
        'answers',
        JSON.stringify({
          '1': 5,
          '2': 4,
          '3': 3,
          '10': 2,
          '24': 1,
        })
      );

      await expect(submitPersonalityTest(formData)).rejects.toThrow('REDIRECT');

      expect(mockCalculatePersonalityScores).toHaveBeenCalledWith({
        1: 5,
        2: 4,
        3: 3,
        10: 2,
        24: 1,
      });
    });

    test('should handle mixed numeric and string keys', async () => {
      const formData = new FormData();
      formData.append(
        'answers',
        JSON.stringify({
          '1': 5,
          '02': 4,
          '10': 3,
          '100': 2,
        })
      );

      await expect(submitPersonalityTest(formData)).rejects.toThrow('REDIRECT');

      expect(mockCalculatePersonalityScores).toHaveBeenCalledWith({
        1: 5,
        2: 4,
        10: 3,
        100: 2,
      });
    });
  });
});
