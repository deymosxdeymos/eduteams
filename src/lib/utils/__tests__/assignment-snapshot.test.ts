import { describe, expect, it, mock } from 'bun:test';
import { markSubmissionsNeedUpdate } from '../assignment-snapshot';

// Create mock Prisma client
const prismaMock: any = {
  assignmentSubmission: {
    updateMany: mock(async () => ({ count: 0 })),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('assignment-snapshot', () => {
  describe('markSubmissionsNeedUpdate', () => {
    it('should mark submissions with older versions as needing update', async () => {
      // Reset the mock before this test
      prismaMock.assignmentSubmission.updateMany.mockReset();

      // Configure mock to simulate marking 1 submission
      prismaMock.assignmentSubmission.updateMany.mockResolvedValueOnce({
        count: 1,
      });

      // Test: Mark submissions with version < 2 (currentVersion = 1, so new version = 2)
      const markedCount = await markSubmissionsNeedUpdate('test-assignment', 1);

      expect(markedCount).toBe(1);

      // Verify the mock was called with correct parameters
      expect(prismaMock.assignmentSubmission.updateMany).toHaveBeenCalledWith({
        where: {
          assignmentId: 'test-assignment',
          structureVersion: {
            lt: 2, // currentVersion + 1
          },
        },
        data: {
          needsUpdate: true,
        },
      });
    });

    it('should not mark submissions if they match the new version', async () => {
      // Reset the mock before this test
      prismaMock.assignmentSubmission.updateMany.mockReset();

      // Configure mock to simulate no submissions needing update
      prismaMock.assignmentSubmission.updateMany.mockResolvedValueOnce({
        count: 0,
      });

      // Test: Try to mark submissions with version < 2
      // If all submissions are already at version 2, count should be 0
      const markedCount = await markSubmissionsNeedUpdate('test-assignment', 1);

      expect(markedCount).toBe(0);

      // Verify the mock was called
      expect(prismaMock.assignmentSubmission.updateMany).toHaveBeenCalledWith({
        where: {
          assignmentId: 'test-assignment',
          structureVersion: {
            lt: 2,
          },
        },
        data: {
          needsUpdate: true,
        },
      });
    });
  });
});
