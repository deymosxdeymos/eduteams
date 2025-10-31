import prisma from '@/lib/prisma';

export interface CreateSnapshotOptions {
  assignmentId: string;
  version: number;
  title: string;
  description: string | null;
  reason?: string;
}

/**
 * Create a snapshot of the assignment before making destructive changes
 */
export async function createAssignmentSnapshot(
  options: CreateSnapshotOptions
): Promise<void> {
  await prisma.assignmentSnapshot.create({
    data: {
      assignmentId: options.assignmentId,
      version: options.version,
      title: options.title,
      description: options.description,
      snapshotReason: options.reason || 'structural_edit',
    },
  });
}

/**
 * Get the latest snapshot version for an assignment
 */
export async function getLatestSnapshotVersion(
  assignmentId: string
): Promise<number> {
  const latest = await prisma.assignmentSnapshot.findFirst({
    where: { assignmentId },
    select: { version: true },
    orderBy: { version: 'desc' },
  });

  return latest?.version || 0;
}

/**
 * Invalidate submissions for an assignment (Tier 3: Destructive changes)
 * This deletes all submissions and related data
 */
export async function invalidateAssignmentSubmissions(
  assignmentId: string
): Promise<number> {
  // Get all student IDs who submitted
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    select: { studentId: true },
  });

  const studentIds = submissions.map(s => s.studentId);

  if (studentIds.length === 0) {
    return 0;
  }

  // Delete in transaction to ensure data consistency
  await prisma.$transaction(async tx => {
    // Delete assignment topic preferences
    await tx.assignmentTopicPreference.deleteMany({
      where: {
        topic: {
          assignmentId,
        },
      },
    });

    // Delete assignment topics
    await tx.assignmentTopic.deleteMany({
      where: { assignmentId },
    });

    // Delete assignment submissions
    await tx.assignmentSubmission.deleteMany({
      where: { assignmentId },
    });

    // Note: We don't delete PersonSkill records as those represent
    // the student's general skill levels, not just for this assignment.
    // The skill assessment is independent and may be used elsewhere.
  });

  return studentIds.length;
}

/**
 * Mark submissions as needing update (Tier 2: Additive changes)
 * This keeps submissions but flags them as incomplete
 */
export async function markSubmissionsNeedUpdate(
  assignmentId: string,
  currentVersion: number
): Promise<number> {
  const result = await prisma.assignmentSubmission.updateMany({
    where: {
      assignmentId,
      structureVersion: {
        lt: currentVersion + 1, // Less than the new version
      },
    },
    data: {
      needsUpdate: true,
    },
  });

  return result.count;
}
