import { describe, it, expect, mock, beforeEach } from 'bun:test';

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

import { POST as onboardingProgressPost } from '@/app/api/user/onboarding-progress/route';
import { GET as onboardingStatusGet } from '@/app/api/user/onboarding-status/route';
import { getCurrentUser } from '@/lib/api-utils';
import { middleware } from '@/middleware';
import prisma from '@/lib/prisma';

// Mock dependencies
mock.module('@/lib/api-utils', () => ({
  getCurrentUser: mock(),
}));

mock.module('@/lib/prisma', () => ({
  default: {
    user: {
      update: mock(),
      findUnique: mock(),
    },
  },
}));

mock.module('next/navigation', () => ({
  redirect: mock(),
}));

describe('Resume Onboarding Integration Flow', () => {
  const mockGetCurrentUser = getCurrentUser as any;
  const mockPrismaUpdate = prisma.user.update as any;
  const mockPrismaFindUnique = prisma.user.findUnique as any;

  beforeEach(() => {
    mockGetCurrentUser.mockReset();
    mockPrismaUpdate.mockReset();
    mockPrismaFindUnique.mockReset();
  });

  describe('Complete Onboarding Flow with Interruptions', () => {
    it('should handle complete mahasiswa onboarding flow with interruptions', async () => {
      // Step 1: User starts onboarding, selects mahasiswa role
      let mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: null,
        isOnboarded: false,
        onboardingStep: null,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      // User selects role
      mockUser = { ...mockUser, role: 'mahasiswa' };
      mockPrismaUpdate.mockResolvedValue({
        ...mockUser,
        onboardingStep: 'role',
      });

      const roleRequest = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'role' }),
        }
      );

      const roleResponse = await onboardingProgressPost(roleRequest);
      const roleData = await roleResponse.json();

      expect(roleResponse.status).toBe(200);
      expect(roleData.success).toBe(true);
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { onboardingStep: 'role' },
      });

      // Step 2: Simulate disconnect/refresh - check onboarding status
      mockUser = { ...mockUser, onboardingStep: 'role' };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const statusResponse1 = await onboardingStatusGet();
      const statusData1 = await statusResponse1.json();

      expect(statusResponse1.status).toBe(200);
      expect(statusData1.redirectUrl).toBe('/onboarding/data-diri/mahasiswa');

      // Step 3: User completes data-diri
      mockUser = { ...mockUser, nimNpm: '12345678' };
      mockPrismaUpdate.mockResolvedValue({
        ...mockUser,
        onboardingStep: 'data-diri',
      });

      const dataDiriRequest = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'data-diri' }),
        }
      );

      const dataDiriResponse = await onboardingProgressPost(dataDiriRequest);
      const dataDiriData = await dataDiriResponse.json();

      expect(dataDiriResponse.status).toBe(200);
      expect(dataDiriData.success).toBe(true);
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { onboardingStep: 'data-diri' },
      });

      // Step 4: Another disconnect/refresh - check status again
      mockUser = { ...mockUser, onboardingStep: 'data-diri' };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const statusResponse2 = await onboardingStatusGet();
      const statusData2 = await statusResponse2.json();

      expect(statusResponse2.status).toBe(200);
      expect(statusData2.redirectUrl).toBe('/onboarding/kepribadian');

      // Step 5: User completes kepribadian
      mockUser = { ...mockUser, onboardingData: { personality: 'extrovert' } };
      mockPrismaUpdate.mockResolvedValue({
        ...mockUser,
        onboardingStep: 'kepribadian',
      });

      const kepribadianRequest = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'kepribadian' }),
        }
      );

      const kepribadianResponse =
        await onboardingProgressPost(kepribadianRequest);
      const kepribadianData = await kepribadianResponse.json();

      expect(kepribadianResponse.status).toBe(200);
      expect(kepribadianData.success).toBe(true);
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { onboardingStep: 'kepribadian' },
      });

      // Step 6: Final status check should redirect to dashboard
      mockUser = {
        ...mockUser,
        onboardingStep: 'kepribadian',
        isOnboarded: true,
      };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const finalStatusResponse = await onboardingStatusGet();
      const finalStatusData = await finalStatusResponse.json();

      expect(finalStatusResponse.status).toBe(200);
      expect(finalStatusData.redirectUrl).toBe(null);
    });

    it('should handle complete dosen onboarding flow with interruptions', async () => {
      // Step 1: User starts onboarding, selects dosen role
      let mockUser = {
        id: 'user-456',
        name: 'Test Dosen',
        email: 'dosen@example.com',
        role: null,
        isOnboarded: false,
        onboardingStep: null,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      // User selects role
      mockUser = { ...mockUser, role: 'dosen' };
      mockPrismaUpdate.mockResolvedValue({
        ...mockUser,
        onboardingStep: 'role',
      });

      const roleRequest = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'role' }),
        }
      );

      const roleResponse = await onboardingProgressPost(roleRequest);
      const roleData = await roleResponse.json();

      expect(roleResponse.status).toBe(200);
      expect(roleData.success).toBe(true);

      // Step 2: Check onboarding status after role selection
      mockUser = { ...mockUser, onboardingStep: 'role' };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const statusResponse1 = await onboardingStatusGet();
      const statusData1 = await statusResponse1.json();

      expect(statusResponse1.status).toBe(200);
      expect(statusData1.redirectUrl).toBe('/onboarding/data-diri/dosen');

      // Step 3: User completes data-diri
      mockUser = { ...mockUser, nimNpm: 'DOS001' };
      mockPrismaUpdate.mockResolvedValue({
        ...mockUser,
        onboardingStep: 'data-diri',
      });

      const dataDiriRequest = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'data-diri' }),
        }
      );

      const dataDiriResponse = await onboardingProgressPost(dataDiriRequest);
      const dataDiriData = await dataDiriResponse.json();

      expect(dataDiriResponse.status).toBe(200);
      expect(dataDiriData.success).toBe(true);

      // Step 4: Final status check should redirect to dashboard (dosen skips kepribadian)
      mockUser = {
        ...mockUser,
        onboardingStep: 'data-diri',
        isOnboarded: true,
      };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const finalStatusResponse = await onboardingStatusGet();
      const finalStatusData = await finalStatusResponse.json();

      expect(finalStatusResponse.status).toBe(200);
      expect(finalStatusData.redirectUrl).toBe(null);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle database connection failures gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: 'role',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'data-diri' }),
        }
      );

      const response = await onboardingProgressPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update progress');
    });

    it('should handle authentication failures during onboarding', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'role' }),
        }
      );

      const response = await onboardingProgressPost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle session expiration during onboarding', async () => {
      // First request succeeds
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: 'role',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue({
        ...mockUser,
        onboardingStep: 'data-diri',
      });

      const request1 = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'data-diri' }),
        }
      );

      const response1 = await onboardingProgressPost(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.success).toBe(true);

      // Second request fails due to session expiration
      mockGetCurrentUser.mockResolvedValue(null);

      const request2 = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'kepribadian' }),
        }
      );

      const response2 = await onboardingProgressPost(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(401);
      expect(data2.error).toBe('Unauthorized');
    });
  });

  describe('Edge Cases in Flow', () => {
    it('should handle role changes during onboarding', async () => {
      // User initially selects mahasiswa
      let mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: 'role',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      const statusResponse1 = await onboardingStatusGet();
      const statusData1 = await statusResponse1.json();

      expect(statusData1.redirectUrl).toBe('/onboarding/data-diri/mahasiswa');

      // User changes role to dosen
      mockUser = { ...mockUser, role: 'dosen' };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const statusResponse2 = await onboardingStatusGet();
      const statusData2 = await statusResponse2.json();

      expect(statusData2.redirectUrl).toBe('/onboarding/data-diri/dosen');
    });

    it('should handle invalid step progression', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: null,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue({
        ...mockUser,
        onboardingStep: 'kepribadian',
      });

      // Try to jump directly to kepribadian without completing previous steps
      const request = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'kepribadian' }),
        }
      );

      const response = await onboardingProgressPost(request);
      const data = await response.json();

      // API should still accept the request (validation is handled by UI)
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle concurrent onboarding progress updates', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: 'role',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrismaUpdate.mockResolvedValue({
        ...mockUser,
        onboardingStep: 'data-diri',
      });

      const request1 = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'data-diri' }),
        }
      );

      const request2 = new Request(
        'http://localhost:3000/api/user/onboarding-progress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'kepribadian' }),
        }
      );

      const [response1, response2] = await Promise.all([
        onboardingProgressPost(request1),
        onboardingProgressPost(request2),
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
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain data consistency throughout the flow', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: null,
      };

      // Track all database updates
      const updateCalls: any[] = [];
      mockPrismaUpdate.mockImplementation(params => {
        updateCalls.push(params);
        return Promise.resolve({
          ...mockUser,
          onboardingStep: params.data.onboardingStep,
        });
      });

      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Execute multiple steps
      const steps = ['role', 'data-diri', 'kepribadian'];

      for (const step of steps) {
        const request = new Request(
          'http://localhost:3000/api/user/onboarding-progress',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step }),
          }
        );

        const response = await onboardingProgressPost(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }

      // Verify all updates were for the same user
      expect(updateCalls).toHaveLength(3);
      updateCalls.forEach(call => {
        expect(call.where.id).toBe('user-123');
      });

      // Verify step progression
      expect(updateCalls[0].data.onboardingStep).toBe('role');
      expect(updateCalls[1].data.onboardingStep).toBe('data-diri');
      expect(updateCalls[2].data.onboardingStep).toBe('kepribadian');
    });

    it('should handle onboarding completion state changes', async () => {
      let mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: 'kepribadian',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Check status before marking as onboarded
      const statusResponse1 = await onboardingStatusGet();
      const statusData1 = await statusResponse1.json();

      expect(statusData1.isOnboarded).toBe(false);
      expect(statusData1.redirectUrl).toBe('/dashboard');

      // Mark user as onboarded
      mockUser = { ...mockUser, isOnboarded: true };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Check status after marking as onboarded
      const statusResponse2 = await onboardingStatusGet();
      const statusData2 = await statusResponse2.json();

      expect(statusData2.isOnboarded).toBe(true);
      expect(statusData2.redirectUrl).toBeNull();
    });
  });
});
