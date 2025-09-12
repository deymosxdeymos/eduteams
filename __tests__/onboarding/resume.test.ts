import { beforeEach, describe, expect, mock, test } from 'bun:test';

// Mock dependencies - MUST be before imports
mock.module('next/navigation', () => ({
  redirect: mock((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
}));

mock.module('@/lib/api-utils', () => ({
  getCurrentUser: mock(),
}));

import { redirect } from 'next/navigation';
import ResumePage from '@/app/onboarding/resume/page';
import { getCurrentUser } from '@/lib/api-utils';

describe('Resume Page Logic', () => {
  const mockRedirect = redirect as any;
  const mockGetCurrentUser = getCurrentUser as any;

  beforeEach(() => {
    mockRedirect.mockReset();
    mockGetCurrentUser.mockReset();
  });

  describe('Authentication Check', () => {
    test('should render session clear client for unauthenticated users with stale session', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      // Should return a JSX element (SessionClearClient) and not call redirect
      const result = await ResumePage();
      expect(result).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('should process authenticated users', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: null,
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      try {
        await ResumePage();
      } catch (error) {
        // Expected to throw redirect error
      }

      expect(mockRedirect).toHaveBeenCalledWith('/onboarding/role');
    });
  });

  describe('Onboarded User Handling', () => {
    test('should redirect onboarded users to dashboard', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: true,
        onboardingStep: 'kepribadian',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      await ResumePage();

      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });

    test('should redirect onboarded dosen to dashboard', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'dosen',
        isOnboarded: true,
        onboardingStep: 'data-diri',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      await ResumePage();

      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Onboarding Step Routing', () => {
    describe('No Progress (null/undefined step)', () => {
      test('should redirect to role selection when onboarding step is null', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: null,
          isOnboarded: false,
          onboardingStep: null,
        };

        mockGetCurrentUser.mockResolvedValue(mockUser);

        await ResumePage();

        expect(mockRedirect).toHaveBeenCalledWith('/onboarding/role');
      });

      test('should redirect to role selection when onboarding step is undefined', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: null,
          isOnboarded: false,
          onboardingStep: undefined,
        };

        mockGetCurrentUser.mockResolvedValue(mockUser);

        await ResumePage();

        expect(mockRedirect).toHaveBeenCalledWith('/onboarding/role');
      });
    });

    describe('Role Step Completed', () => {
      test('should redirect mahasiswa to data-diri after role completion', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'mahasiswa',
          isOnboarded: false,
          onboardingStep: 'role',
        };

        mockGetCurrentUser.mockResolvedValue(mockUser);

        await ResumePage();

        expect(mockRedirect).toHaveBeenCalledWith(
          '/onboarding/data-diri/mahasiswa'
        );
      });

      test('should redirect dosen with non-institutional email back to role with error after role completion', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'dosen',
          isOnboarded: false,
          onboardingStep: 'role',
        };

        mockGetCurrentUser.mockResolvedValue(mockUser);

        await ResumePage();

        expect(mockRedirect).toHaveBeenCalledWith('/onboarding/role?err=dosen_email');
      });
    });

    describe('Data-Diri Step Completed', () => {
      test('should redirect mahasiswa to kepribadian after data-diri completion', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'mahasiswa',
          isOnboarded: false,
          onboardingStep: 'data-diri',
        };

        mockGetCurrentUser.mockResolvedValue(mockUser);

        await ResumePage();

        expect(mockRedirect).toHaveBeenCalledWith('/onboarding/kepribadian');
      });

      test('should redirect dosen to dashboard after data-diri completion', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'dosen',
          isOnboarded: false,
          onboardingStep: 'data-diri',
        };

        mockGetCurrentUser.mockResolvedValue(mockUser);

        await ResumePage();

        expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
      });
    });

    describe('Kepribadian Step Completed', () => {
      test('should redirect to dashboard after kepribadian completion', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'mahasiswa',
          isOnboarded: false,
          onboardingStep: 'kepribadian',
        };

        mockGetCurrentUser.mockResolvedValue(mockUser);

        await ResumePage();

        expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
      });
    });

    describe('Invalid Step Values', () => {
      test('should redirect to role selection for invalid step values', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'mahasiswa',
          isOnboarded: false,
          onboardingStep: 'invalid-step',
        };

        mockGetCurrentUser.mockResolvedValue(mockUser);

        await ResumePage();

        expect(mockRedirect).toHaveBeenCalledWith('/onboarding/role');
      });

      test('should redirect to role selection for empty string step', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'mahasiswa',
          isOnboarded: false,
          onboardingStep: '',
        };

        mockGetCurrentUser.mockResolvedValue(mockUser);

        await ResumePage();

        expect(mockRedirect).toHaveBeenCalledWith('/onboarding/role');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle users with no role but with onboarding step', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: null,
        isOnboarded: false,
        onboardingStep: 'role',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      await ResumePage();

      expect(mockRedirect).toHaveBeenCalledWith('/onboarding/data-diri/null');
    });

    test('should handle users with undefined role but with data-diri step', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: undefined,
        isOnboarded: false,
        onboardingStep: 'data-diri',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      await ResumePage();

      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });

    test('should handle users with inconsistent onboarding state', async () => {
      // User is marked as onboarded but has incomplete step
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: true,
        onboardingStep: 'role',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      await ResumePage();

      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });

    test('should handle users with null role and data-diri step', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: null,
        isOnboarded: false,
        onboardingStep: 'data-diri',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      await ResumePage();

      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Error Handling', () => {
    test('should handle getCurrentUser errors', async () => {
      mockGetCurrentUser.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(ResumePage()).rejects.toThrow('Database connection failed');
    });

    test('should handle redirect errors', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: 'role',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockRedirect.mockImplementation(() => {
        throw new Error('Redirect failed');
      });

      await expect(ResumePage()).rejects.toThrow('Redirect failed');
    });
  });

  describe('Multiple Scenarios', () => {
    test('should handle rapid successive calls correctly', async () => {
      // Create a fresh mock for this test to avoid interference
      const testMockRedirect = mock((url: string) => {
        throw new Error(`NEXT_REDIRECT: ${url}`);
      });

      // Mock the redirect function just for this test
      (redirect as any).mockImplementation(testMockRedirect);

      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: false,
        onboardingStep: 'role',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Call multiple times
      await Promise.all([
        ResumePage().catch(() => {}),
        ResumePage().catch(() => {}),
        ResumePage().catch(() => {}),
      ]);

      expect(testMockRedirect).toHaveBeenCalledTimes(3);
      expect(testMockRedirect).toHaveBeenCalledWith(
        '/onboarding/data-diri/mahasiswa'
      );

      // Restore the original mock
      (redirect as any).mockImplementation(mockRedirect);
    });
    test('should handle different users with different states', async () => {
      const users = [
        {
          id: 'user-1',
          name: 'Test User 1',
          email: 'test1@example.com',
          role: 'mahasiswa',
          isOnboarded: false,
          onboardingStep: null,
        },
        {
          id: 'user-2',
          name: 'Test User 2',
          email: 'test2@example.com',
          role: 'dosen',
          isOnboarded: false,
          onboardingStep: 'role',
        },
        {
          id: 'user-3',
          name: 'Test User 3',
          email: 'test3@example.com',
          role: 'mahasiswa',
          isOnboarded: true,
          onboardingStep: 'kepribadian',
        },
      ];

      const expectedRedirects = [
        '/onboarding/role',
        '/onboarding/role?err=dosen_email',
        '/dashboard',
      ];

      for (let i = 0; i < users.length; i++) {
        mockRedirect.mockClear();
        mockGetCurrentUser.mockResolvedValue(users[i]);

        await ResumePage();

        expect(mockRedirect).toHaveBeenCalledWith(expectedRedirects[i]);
      }
    });
  });
});
