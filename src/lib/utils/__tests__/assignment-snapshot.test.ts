// Grey box tests: partial knowledge, real DB, verify state + returns

import { describe, expect, it, beforeEach } from 'bun:test';

// Run this suite only when GREY=1 to avoid interference with unit tests that mock Prisma
const RUN_GREY = process.env.GREY === '1';
const suite = (RUN_GREY ? describe.serial : describe.skip) as typeof describe.serial;

type SnapshotModule = typeof import('../assignment-snapshot');
type DbHelpers = typeof import('@tests/helpers/db');
type Factories = typeof import('@tests/helpers/factories');
type PrismaClient = import('@prisma/client').PrismaClient;

let markSubmissionsNeedUpdate!: SnapshotModule['markSubmissionsNeedUpdate'];
let invalidateAssignmentSubmissions!: SnapshotModule['invalidateAssignmentSubmissions'];
let createAssignmentSnapshot!: SnapshotModule['createAssignmentSnapshot'];
let getLatestSnapshotVersion!: SnapshotModule['getLatestSnapshotVersion'];
let resetDatabase!: DbHelpers['resetDatabase'];
let createTestAssignment!: Factories['createTestAssignment'];
let createTestSubmissions!: Factories['createTestSubmissions'];
let prisma!: PrismaClient;

if (RUN_GREY) {
  const [
    snapshotModule,
    dbHelpers,
    factories,
    prismaModule,
  ] = await Promise.all([
    import('../assignment-snapshot'),
    import('@tests/helpers/db'),
    import('@tests/helpers/factories'),
    import('@/lib/prisma'),
  ]);

  markSubmissionsNeedUpdate = snapshotModule.markSubmissionsNeedUpdate;
  invalidateAssignmentSubmissions = snapshotModule.invalidateAssignmentSubmissions;
  createAssignmentSnapshot = snapshotModule.createAssignmentSnapshot;
  getLatestSnapshotVersion = snapshotModule.getLatestSnapshotVersion;
  resetDatabase = dbHelpers.resetDatabase;
  createTestAssignment = factories.createTestAssignment;
  createTestSubmissions = factories.createTestSubmissions;
  prisma = prismaModule.default;
}

suite('assignment-snapshot (grey box)', () => {
  if (!RUN_GREY) return;

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('markSubmissionsNeedUpdate', () => {
    it('should mark submissions with older versions as needing update', async () => {
      const assignment = await createTestAssignment({ structureVersion: 1 });
      await createTestSubmissions(assignment.id, 3, { structureVersion: 1 });

      const markedCount = await markSubmissionsNeedUpdate(assignment.id, 1);

      expect(markedCount).toBe(3);

      const submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId: assignment.id },
      });

      expect(submissions).toHaveLength(3);
      expect(submissions.every((s) => s.needsUpdate === true)).toBe(true);
    });

    it('should not mark submissions that match the new version', async () => {
      const assignment = await createTestAssignment({ structureVersion: 2 });
      await createTestSubmissions(assignment.id, 2, { structureVersion: 2 });

      const markedCount = await markSubmissionsNeedUpdate(assignment.id, 1);

      expect(markedCount).toBe(0);

      const submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId: assignment.id },
      });

      expect(submissions).toHaveLength(2);
      expect(submissions.every((s) => s.needsUpdate === false)).toBe(true);
    });

    it('should only mark submissions with versions older than new version', async () => {
      const assignment = await createTestAssignment({ structureVersion: 1 });
      await createTestSubmissions(assignment.id, 2, { structureVersion: 1 });
      await createTestSubmissions(assignment.id, 2, { structureVersion: 2 });

      const markedCount = await markSubmissionsNeedUpdate(assignment.id, 1);

      expect(markedCount).toBe(2);
      const v1Submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId: assignment.id, structureVersion: 1 },
      });
      const v2Submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId: assignment.id, structureVersion: 2 },
      });

      expect(v1Submissions).toHaveLength(2);
      expect(v1Submissions.every((s) => s.needsUpdate === true)).toBe(true);

      expect(v2Submissions).toHaveLength(2);
      expect(v2Submissions.every((s) => s.needsUpdate === false)).toBe(true);
    });
  });

  describe('invalidateAssignmentSubmissions', () => {
    it('should delete all submissions and related data', async () => {
      const assignment = await createTestAssignment();
      const submissions = await createTestSubmissions(assignment.id, 2);

      const deletedCount = await invalidateAssignmentSubmissions(assignment.id);

      expect(deletedCount).toBe(2);

      const remainingSubmissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId: assignment.id },
      });
      expect(remainingSubmissions).toHaveLength(0);
    });

    it('should return 0 when no submissions exist', async () => {
      const assignment = await createTestAssignment();

      const deletedCount = await invalidateAssignmentSubmissions(assignment.id);

      expect(deletedCount).toBe(0);
    });
  });

  describe('createAssignmentSnapshot', () => {
    it('should create a snapshot in the database', async () => {
      const assignment = await createTestAssignment({
        title: 'Original Title',
        description: 'Original Description',
      });
      await createAssignmentSnapshot({
        assignmentId: assignment.id,
        version: 1,
        title: assignment.title,
        description: assignment.description,
        reason: 'structural_edit',
      });

      const snapshot = await prisma.assignmentSnapshot.findUnique({
        where: {
          assignmentId_version: {
            assignmentId: assignment.id,
            version: 1,
          },
        },
      });

      expect(snapshot).toBeDefined();
      expect(snapshot?.title).toBe('Original Title');
      expect(snapshot?.description).toBe('Original Description');
      expect(snapshot?.snapshotReason).toBe('structural_edit');
    });
  });

  describe('getLatestSnapshotVersion', () => {
    it('should return the latest snapshot version', async () => {
      const assignment = await createTestAssignment();

      await createAssignmentSnapshot({
        assignmentId: assignment.id,
        version: 1,
        title: 'Version 1',
        description: null,
      });

      await createAssignmentSnapshot({
        assignmentId: assignment.id,
        version: 2,
        title: 'Version 2',
        description: null,
      });

      const latestVersion = await getLatestSnapshotVersion(assignment.id);

      expect(latestVersion).toBe(2);
    });

    it('should return 0 when no snapshots exist', async () => {
      const assignment = await createTestAssignment();

      const latestVersion = await getLatestSnapshotVersion(assignment.id);

      expect(latestVersion).toBe(0);
    });
  });
});
