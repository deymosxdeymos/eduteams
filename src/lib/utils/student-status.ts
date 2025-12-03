import type { AssignmentStatus } from '@/generated/prisma';

interface StatusDetectionInput {
  assignmentStatus: AssignmentStatus;
  hasSubmission: boolean;
  isInTeam: boolean;
}

export type StudentAssignmentStatus = 'my-group' | 'waiting' | 'not-started';

/**
 * Determines the student's status for a specific assignment
 * @returns 'my-group' | 'waiting' | 'not-started'
 */
export function getStudentAssignmentStatus(
  input: StatusDetectionInput
): StudentAssignmentStatus {
  const { hasSubmission, isInTeam } = input;

  // If student is in a team, they're in 'my-group' status
  if (isInTeam) {
    return 'my-group';
  }

  // If student has submitted, they're waiting for team formation
  if (hasSubmission) {
    return 'waiting';
  }

  // Otherwise, they haven't started (even if assignment status is MENUNGGU)
  return 'not-started';
}
