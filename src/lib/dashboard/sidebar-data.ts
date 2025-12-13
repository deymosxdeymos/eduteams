import { getCurrentUser } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { getStudentAssignmentStatus } from '@/lib/utils/student-status';

interface TeamMember {
  userId: string;
}

interface Team {
  members: TeamMember[];
}

interface AssignmentWithTeams {
  id: string;
  status: string;
  createdById: string;
  startAt: Date | null;
  teamFormationRequests: {
    teams: Team[];
  }[];
}

export async function getSidebarData() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      notStartedCount: 0,
    };
  }

  // For mahasiswa users, get not-started count
  let notStartedCount = 0;
  if (user.role === 'mahasiswa') {
    // Get all courses student is enrolled in
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: user.id },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((e: { courseId: string }) => e.courseId);

    if (courseIds.length > 0) {
      // Get all active assignments
      const assignments = await prisma.assignment.findMany({
        where: {
          courseId: { in: courseIds },
          archivedAt: null,
        },
        select: {
          id: true,
          status: true,
          createdById: true,
          startAt: true,
          teamFormationRequests: {
            where: {
              status: 'COMPLETED',
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              teams: {
                select: {
                  members: {
                    select: {
                      userId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Get all submissions for this student (excluding those that need updates)
      const submissions = await prisma.assignmentSubmission.findMany({
        where: {
          studentId: user.id,
          assignmentId: { in: assignments.map((a: { id: string }) => a.id) },
          needsUpdate: false,
        },
        select: { assignmentId: true },
      });

      const submissionSet = new Set(
        submissions.map((s: { assignmentId: string }) => s.assignmentId)
      );

      // Batch fetch all legacy team formations to avoid N+1 query
      const assignmentsNeedingLegacy = assignments.filter(
        (a: AssignmentWithTeams) => a.teamFormationRequests.length === 0
      );
      const legacyTeamFormations =
        assignmentsNeedingLegacy.length > 0
          ? await prisma.teamFormationRequest.findMany({
              where: {
                ownerId: {
                  in: assignmentsNeedingLegacy.map(
                    (a: AssignmentWithTeams) => a.createdById
                  ),
                },
                assignmentId: null,
                status: 'COMPLETED',
              },
              select: {
                ownerId: true,
                createdAt: true,
                teams: {
                  select: {
                    members: {
                      select: {
                        userId: true,
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            })
          : [];

      // Create a map of ownerId -> legacy team formation for quick lookup
      const legacyByOwner = new Map<
        string,
        (typeof legacyTeamFormations)[number]
      >();
      for (const legacy of legacyTeamFormations) {
        if (!legacyByOwner.has(legacy.ownerId)) {
          legacyByOwner.set(legacy.ownerId, legacy);
        }
      }

      // Count not-started assignments
      for (const assignment of assignments) {
        const hasSubmission = submissionSet.has(assignment.id);
        let teamFormation = assignment.teamFormationRequests[0];

        // Fallback for legacy data: use pre-fetched legacy team formation
        if (!teamFormation) {
          const legacy = legacyByOwner.get(assignment.createdById);
          if (
            legacy &&
            (!assignment.startAt || legacy.createdAt >= assignment.startAt)
          ) {
            teamFormation = legacy;
          }
        }

        const isInTeam = teamFormation?.teams.some((team: Team) =>
          team.members.some((m: TeamMember) => m.userId === user.id)
        );

        const status = getStudentAssignmentStatus({
          assignmentStatus: assignment.status,
          hasSubmission,
          isInTeam: isInTeam ?? false,
        });

        if (status === 'not-started') {
          notStartedCount++;
        }
      }
    }
  }

  return {
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'unknown',
        }
      : null,
    notStartedCount,
  };
}
