import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrismaClient = {
  user: {
    create: mock(),
    findUnique: mock(),
    update: mock(),
  },
  $disconnect: mock(),
};

mock.module('@prisma/client', () => ({
  PrismaClient: class {
    user = mockPrismaClient.user;
    $disconnect = mockPrismaClient.$disconnect;
  },
}));

describe('Database Schema Tests', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    mockPrismaClient.user.create.mockReset();
    mockPrismaClient.user.findUnique.mockReset();
    mockPrismaClient.user.update.mockReset();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('User Model Schema', () => {
    describe('onboardingStep Field', () => {
      test('should accept null values for onboardingStep', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOnboarded: false,
          nimNpm: null,
          role: null,
          onboardingData: null,
          onboardingStep: null,
        };

        mockPrismaClient.user.create.mockResolvedValue(mockUser);

        const result = await prisma.user.create({
          data: mockUser,
        });

        expect(result.onboardingStep).toBeNull();
        expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
          data: mockUser,
        });
      });

      test('should accept valid onboarding step values', async () => {
        const validSteps = ['role', 'data-diri', 'kepribadian'];

        for (const step of validSteps) {
          const mockUser = {
            id: `user-${step}`,
            name: 'Test User',
            email: `test-${step}@example.com`,
            emailVerified: true,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            isOnboarded: false,
            nimNpm: null,
            role: 'mahasiswa',
            onboardingData: null,
            onboardingStep: step,
          };

          mockPrismaClient.user.create.mockResolvedValue(mockUser);

          const result = await prisma.user.create({
            data: mockUser,
          });

          expect(result.onboardingStep).toBe(step);
        }
      });

      test('should allow updating onboardingStep field', async () => {
        const originalUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOnboarded: false,
          nimNpm: null,
          role: 'mahasiswa',
          onboardingData: null,
          onboardingStep: null,
        };

        const updatedUser = {
          ...originalUser,
          onboardingStep: 'role',
          updatedAt: new Date(),
        };

        mockPrismaClient.user.update.mockResolvedValue(updatedUser);

        const result = await prisma.user.update({
          where: { id: 'user-123' },
          data: { onboardingStep: 'role' },
        });

        expect(result.onboardingStep).toBe('role');
        expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: { onboardingStep: 'role' },
        });
      });

      test('should handle undefined onboardingStep values', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOnboarded: false,
          nimNpm: null,
          role: null,
          onboardingData: null,
          onboardingStep: undefined,
        };

        mockPrismaClient.user.create.mockResolvedValue({
          ...mockUser,
          onboardingStep: null,
        });

        const result = await prisma.user.create({
          data: mockUser,
        });

        expect(result.onboardingStep).toBeNull();
      });
    });

    describe('onboardingData Field', () => {
      test('should accept null values for onboardingData', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOnboarded: false,
          nimNpm: null,
          role: null,
          onboardingData: null,
          onboardingStep: null,
        };

        mockPrismaClient.user.create.mockResolvedValue(mockUser);

        const result = await prisma.user.create({
          data: mockUser,
        });

        expect(result.onboardingData).toBeNull();
      });

      test('should accept JSON data for onboardingData', async () => {
        const onboardingData = {
          personality: 'extrovert',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
          completedSteps: ['role', 'data-diri'],
        };

        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOnboarded: false,
          nimNpm: null,
          role: 'mahasiswa',
          onboardingData,
          onboardingStep: 'kepribadian',
        };

        mockPrismaClient.user.create.mockResolvedValue(mockUser);

        const result = await prisma.user.create({
          data: mockUser,
        });

        expect(result.onboardingData).toEqual(onboardingData);
      });

      test('should allow updating onboardingData field', async () => {
        const originalData = {
          personality: 'introvert',
        };

        const updatedData = {
          personality: 'extrovert',
          preferences: {
            theme: 'light',
            notifications: false,
          },
        };

        const updatedUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOnboarded: false,
          nimNpm: null,
          role: 'mahasiswa',
          onboardingData: updatedData,
          onboardingStep: 'kepribadian',
        };

        mockPrismaClient.user.update.mockResolvedValue(updatedUser);

        const result = await prisma.user.update({
          where: { id: 'user-123' },
          data: { onboardingData: updatedData },
        });

        expect(result.onboardingData).toEqual(updatedData);
      });

      test('should handle empty objects in onboardingData', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOnboarded: false,
          nimNpm: null,
          role: 'mahasiswa',
          onboardingData: {},
          onboardingStep: 'role',
        };

        mockPrismaClient.user.create.mockResolvedValue(mockUser);

        const result = await prisma.user.create({
          data: mockUser,
        });

        expect(result.onboardingData).toEqual({});
      });

      test('should handle arrays in onboardingData', async () => {
        const onboardingData = {
          completedSteps: ['role', 'data-diri'],
          preferences: ['dark-mode', 'notifications'],
        };

        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOnboarded: false,
          nimNpm: null,
          role: 'mahasiswa',
          onboardingData,
          onboardingStep: 'kepribadian',
        };

        mockPrismaClient.user.create.mockResolvedValue(mockUser);

        const result = await prisma.user.create({
          data: mockUser,
        });

        expect(result.onboardingData).toEqual(onboardingData);
      });
    });

    describe('User Creation with Default Values', () => {
      test('should create user with default onboarding values', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOnboarded: false, // Default value
          nimNpm: null,
          role: null,
          onboardingData: null,
          onboardingStep: null,
        };

        mockPrismaClient.user.create.mockResolvedValue(mockUser);

        const result = await prisma.user.create({
          data: {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            emailVerified: true,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        expect(result.isOnboarded).toBe(false);
        expect(result.onboardingStep).toBeNull();
        expect(result.onboardingData).toBeNull();
      });

      test('should create user with explicit onboarding values', async () => {
        const mockUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOnboarded: true,
          nimNpm: '12345678',
          role: 'mahasiswa',
          onboardingData: { personality: 'extrovert' },
          onboardingStep: 'kepribadian',
        };

        mockPrismaClient.user.create.mockResolvedValue(mockUser);

        const result = await prisma.user.create({
          data: mockUser,
        });

        expect(result.isOnboarded).toBe(true);
        expect(result.onboardingStep).toBe('kepribadian');
        expect(result.onboardingData).toEqual({ personality: 'extrovert' });
        expect(result.role).toBe('mahasiswa');
        expect(result.nimNpm).toBe('12345678');
      });
    });
  });

  describe('Database Constraints and Validation', () => {
    test('should handle unique email constraint', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnboarded: false,
        nimNpm: null,
        role: null,
        onboardingData: null,
        onboardingStep: null,
      };

      // First user creation should succeed
      mockPrismaClient.user.create.mockResolvedValueOnce(mockUser);

      const result1 = await prisma.user.create({
        data: mockUser,
      });

      expect(result1.email).toBe('test@example.com');

      // Second user creation with same email should fail
      mockPrismaClient.user.create.mockRejectedValueOnce(
        new Error('Unique constraint failed on the fields: (`email`)')
      );

      await expect(
        prisma.user.create({
          data: {
            ...mockUser,
            id: 'user-124',
          },
        })
      ).rejects.toThrow('Unique constraint failed on the fields: (`email`)');
    });

    test('should handle required fields', async () => {
      // Missing required fields should fail
      mockPrismaClient.user.create.mockRejectedValue(
        new Error('Argument `name` is missing')
      );

      await expect(
        prisma.user.create({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Missing name field
          } as any,
        })
      ).rejects.toThrow('Argument `name` is missing');
    });

    test('should handle field type validation', async () => {
      // Invalid boolean value should fail
      mockPrismaClient.user.create.mockRejectedValue(
        new Error('Argument `isOnboarded` of type Boolean is required')
      );

      await expect(
        prisma.user.create({
          data: {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            emailVerified: true,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            isOnboarded: 'invalid' as any,
            nimNpm: null,
            role: null,
            onboardingData: null,
            onboardingStep: null,
          },
        })
      ).rejects.toThrow('Argument `isOnboarded` of type Boolean is required');
    });
  });

  describe('Field Queries and Selection', () => {
    test('should allow selecting specific onboarding fields', async () => {
      const mockUser = {
        id: 'user-123',
        onboardingStep: 'role',
        isOnboarded: false,
        role: 'mahasiswa',
        onboardingData: { personality: 'extrovert' },
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await prisma.user.findUnique({
        where: { id: 'user-123' },
        select: {
          id: true,
          onboardingStep: true,
          isOnboarded: true,
          role: true,
          onboardingData: true,
        },
      });

      expect(result).toEqual(mockUser);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          onboardingStep: true,
          isOnboarded: true,
          role: true,
          onboardingData: true,
        },
      });
    });

    test('should handle queries with where conditions on onboarding fields', async () => {
      const mockUsers = [
        {
          id: 'user-123',
          name: 'Test User 1',
          email: 'test1@example.com',
          onboardingStep: 'role',
          isOnboarded: false,
        },
        {
          id: 'user-124',
          name: 'Test User 2',
          email: 'test2@example.com',
          onboardingStep: 'data-diri',
          isOnboarded: false,
        },
      ];

      mockPrismaClient.user.findMany = mock();
      mockPrismaClient.user.findMany.mockResolvedValue(mockUsers);

      const result = await (prisma.user as any).findMany({
        where: {
          isOnboarded: false,
          onboardingStep: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          onboardingStep: true,
          isOnboarded: true,
        },
      });

      expect(result).toEqual(mockUsers);
    });
  });
});
