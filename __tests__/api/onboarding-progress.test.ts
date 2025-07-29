import { beforeEach, describe, expect, mock, test } from 'bun:test';

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

// Mock dependencies
mock.module('@/lib/api-utils', () => ({
  getCurrentUser: mock(),
}));

mock.module('@/lib/prisma', () => ({
  default: {
    user: {
      update: mock(),
    },
  },
}));

import { POST } from '@/app/api/user/onboarding-progress/route';
import { getCurrentUser } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

describe('POST /api/user/onboarding-progress', () => {
  const mockGetCurrentUser = getCurrentUser as any;
  const mockPrismaUpdate = prisma.user.update as any;

  beforeEach(() => {
    mockGetCurrentUser.mockReset();
    mockPrismaUpdate.mockReset();
  });

  describe('Authentication', () => {
    test('should return 401 for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'role' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaUpdate).not.toHaveBeenCalled();
    });

    test('should process request for authenticated users', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: null,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue(mockUser);

      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'role' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { onboardingStep: 'role' },
      });
    });
  });

  describe('Step Validation', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'mahasiswa',
      isOnboarded: false,
      onboardingStep: null,
    };

    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue(mockUser);
    });

    test.each(['role', 'data-diri', 'kepribadian'])(
      'should accept valid step value: %s',
      async step => {
        mockPrismaUpdate.mockClear();

        const request = new Request(
          'http://localhost:3000/api/user/onboarding-progress',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step }),
          }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockPrismaUpdate).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: { onboardingStep: step },
        });
      }
    );

    test('should handle invalid step values gracefully', async () => {
      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'invalid-step' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { onboardingStep: 'invalid-step' },
      });
    });

    test('should handle null/undefined step values', async () => {
      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: null }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { onboardingStep: null },
      });
    });
  });

  describe('Error Handling', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'mahasiswa',
      isOnboarded: false,
      onboardingStep: null,
    };

    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
    });

    test('should handle database errors gracefully', async () => {
      mockPrismaUpdate.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'role' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update progress');
    }, 10000);

    test('should handle malformed JSON gracefully', async () => {
      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update progress');
    });

    test.skip('should handle rate limiting', async () => {
      // TODO: Implement rate limiting tests when rate limiting is added
      // This test is skipped until rate limiting feature is implemented
    });

    test('should handle getCurrentUser errors', async () => {
      mockGetCurrentUser.mockRejectedValue(
        new Error('Auth service unavailable')
      );

      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'role' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update progress');
    });
  });

  describe('Edge Cases', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'mahasiswa',
      isOnboarded: false,
      onboardingStep: null,
    };

    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue(mockUser);
    });

    test('should handle empty request body', async () => {
      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { onboardingStep: undefined },
      });
    });

    test('should handle already onboarded users', async () => {
      const onboardedUser = {
        ...mockUser,
        isOnboarded: true,
        onboardingStep: 'kepribadian',
      };

      mockGetCurrentUser.mockResolvedValue(onboardedUser);

      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'role' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { onboardingStep: 'role' },
      });
    });

    test('should handle concurrent updates', async () => {
      expect.assertions(6);

      const request1 = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'role' }),
        }
      );

      const request2 = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'data-diri' }),
        }
      );

      const [response1, response2] = await Promise.all([
        POST(request1),
        POST(request2),
      ]);

      const [data1, data2] = await Promise.all([
        response1.json(),
        response2.json(),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(data2.success).toBe(true);
      expect(mockPrismaUpdate).toHaveBeenCalledTimes(2);
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { onboardingStep: 'role' },
      });
    });
  });
});
