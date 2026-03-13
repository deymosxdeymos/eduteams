import type { AssignmentStatus } from "@/generated/prisma/client";

interface StatusDetectionInput {
  assignmentStatus: AssignmentStatus;
  hasSubmission: boolean;
  isInTeam: boolean;
}

export type StudentAssignmentStatus = "my-group" | "waiting" | "not-started";

/**
 * Determines the student's status for a specific assignment
 *
 * @param input - Object containing assignment status, submission status, and team membership
 * @returns One of: 'my-group', 'waiting', or 'not-started'
 *
 * Logic:
 * - 'my-group': Student is assigned to a team (team formation completed and student is in a team)
 * - 'waiting': Student has submitted and is waiting for team formation
 * - 'not-started': Student hasn't submitted yet (regardless of assignment status)
 */
export function getStudentAssignmentStatus(input: StatusDetectionInput): StudentAssignmentStatus {
  const { hasSubmission, isInTeam } = input;

  // If student is in a team, they're in 'my-group' status
  if (isInTeam) {
    return "my-group";
  }

  // If student has submitted, they're waiting for team formation
  if (hasSubmission) {
    return "waiting";
  }

  // Otherwise, they haven't started (even if assignment status is MENUNGGU)
  return "not-started";
}
