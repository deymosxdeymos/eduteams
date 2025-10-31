import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { markSubmissionsNeedUpdate } from '../assignment-snapshot';
import prisma from '../../prisma';

describe('assignment-snapshot', () => {
  let testUser: { id: string };
  let testCourse: { id: string };
  let testAssignment: { id: string };

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: 'Test Student',
        email: `test-${Date.now()}@example.com`,
        role: 'mahasiswa',
        isOnboarded: true,
      },
    });

    // Create test course
    testCourse = await prisma.course.create({
      data: {
        name: 'Test Course',
        semester: 'Fall 2024',
        ownerId: testUser.id,
      },
    });

    // Create test assignment
    testAssignment = await prisma.assignment.create({
      data: {
        title: 'Test Assignment',
        courseId: testCourse.id,
        createdById: testUser.id,
        structureVersion: 1,
      },
    });
  });

  afterEach(async () => {
    // Clean up in reverse order
    await prisma.assignmentSubmission.deleteMany({
      where: { assignmentId: testAssignment.id },
    });
    await prisma.assignment.deleteMany({
      where: { id: testAssignment.id },
    });
    await prisma.courseEnrollment.deleteMany({
      where: { studentId: testUser.id },
    });
    await prisma.course.deleteMany({
      where: { id: testCourse.id },
    });
    await prisma.user.deleteMany({
      where: { id: testUser.id },
    });
  });

  describe('markSubmissionsNeedUpdate', () => {
    it('should not mark submissions created with current version as needing update', async () => {
      // Create submission with structureVersion = 1
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId: testAssignment.id,
          studentId: testUser.id,
          structureVersion: 1,
          needsUpdate: false,
        },
      });

      // Simulate first structural edit: bump to version 2
      await prisma.assignment.update({
        where: { id: testAssignment.id },
        data: { structureVersion: 2 },
      });

      // Mark old submissions as needing update (currentVersion = 1, so new version = 2)
      const markedCount = await markSubmissionsNeedUpdate(testAssignment.id, 1);
      expect(markedCount).toBe(1);

      // Student resubmits with the new structure version 2
      await prisma.assignmentSubmission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId: testAssignment.id,
            studentId: testUser.id,
          },
        },
        update: {
          structureVersion: 2,
          needsUpdate: false,
        },
        create: {
          assignmentId: testAssignment.id,
          studentId: testUser.id,
          structureVersion: 2,
          needsUpdate: false,
        },
      });

      // Verify submission has version 2 and doesn't need update
      let submission = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId: testAssignment.id,
            studentId: testUser.id,
          },
        },
      });
      expect(submission?.structureVersion).toBe(2);
      expect(submission?.needsUpdate).toBe(false);

      // Simulate second structural edit: bump to version 3
      await prisma.assignment.update({
        where: { id: testAssignment.id },
        data: { structureVersion: 3 },
      });

      // Mark old submissions as needing update (currentVersion = 2, so new version = 3)
      const markedCount2 = await markSubmissionsNeedUpdate(
        testAssignment.id,
        2
      );

      // The submission should be marked since it has version 2 < 3
      expect(markedCount2).toBe(1);

      submission = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId: testAssignment.id,
            studentId: testUser.id,
          },
        },
      });
      expect(submission?.needsUpdate).toBe(true);
    });

    it('should not mark submissions if they match the new version', async () => {
      // Create submission with structureVersion = 2 (already at latest)
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId: testAssignment.id,
          studentId: testUser.id,
          structureVersion: 2,
          needsUpdate: false,
        },
      });

      // Update assignment to version 2
      await prisma.assignment.update({
        where: { id: testAssignment.id },
        data: { structureVersion: 2 },
      });

      // Try to mark submissions with currentVersion = 1 (bumps to 2)
      const markedCount = await markSubmissionsNeedUpdate(testAssignment.id, 1);

      // Should not mark the submission since it's already at version 2
      expect(markedCount).toBe(0);

      const submission = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId: testAssignment.id,
            studentId: testUser.id,
          },
        },
      });
      expect(submission?.needsUpdate).toBe(false);
    });
  });
});
