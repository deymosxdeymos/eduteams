import { beforeEach, describe, expect, it, mock } from 'bun:test';

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

import { GET } from '@/app/api/user/onboarding-status/route';
import { getCurrentUser } from '@/lib/api-utils';

const mockGetCurrentUser = getCurrentUser as any;

describe('GET /api/user/onboarding-status', () => {
  beforeEach(() => {
    mockGetCurrentUser.mockReset();
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.redirectUrl).toBeUndefined();
    });

    it('should handle missing role for data-diri step', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: null,
        isOnboarded: false,
        onboardingStep: 'data-diri',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      const response = await GET();
      const data = await response.json();

      expect(data.redirectUrl).toBe('/onboarding/role');
    });
  });

  describe('Error Handling', () => {
    it('should handle getCurrentUser errors', async () => {
      mockGetCurrentUser.mockRejectedValue(
        new Error('Auth service unavailable')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockGetCurrentUser.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
