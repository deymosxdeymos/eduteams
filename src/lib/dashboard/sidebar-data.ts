import { unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/api-utils";
import prisma from "@/lib/prisma";
import { getStudentAssignmentStatus } from "@/lib/utils/student-status";

interface SidebarUserInput {
  id: string;
  name: string;
  email: string;
  role: string | null | undefined;
}

export interface SidebarData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  notStartedCount: number;
}

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

async function fetchNotStartedCount(userId: string): Promise<number> {
  // Get enrollments and assignments in parallel
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId: userId },
    select: { courseId: true },
  });

  const courseIds = enrollments.map((e: { courseId: string }) => e.courseId);

  if (courseIds.length === 0) {
    return 0;
  }

  // Parallel fetch: assignments and submissions
  const [assignments, submissions] = await Promise.all([
    prisma.assignment.findMany({
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
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            teams: {
              select: {
                members: {
                  select: { userId: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.assignmentSubmission.findMany({
      where: {
        studentId: userId,
        needsUpdate: false,
      },
      select: { assignmentId: true },
    }),
  ]);

  const submissionSet = new Set(submissions.map((s: { assignmentId: string }) => s.assignmentId));

  // Batch fetch all legacy team formations to avoid N+1 query
  const assignmentsNeedingLegacy = assignments.filter(
    (a: AssignmentWithTeams) => a.teamFormationRequests.length === 0,
  );
  const legacyTeamFormations =
    assignmentsNeedingLegacy.length > 0
      ? await prisma.teamFormationRequest.findMany({
          where: {
            ownerId: {
              in: assignmentsNeedingLegacy.map((a: AssignmentWithTeams) => a.createdById),
            },
            assignmentId: null,
            status: "COMPLETED",
          },
          select: {
            ownerId: true,
            createdAt: true,
            teams: {
              select: {
                members: {
                  select: { userId: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  // Create a map of ownerId -> legacy team formation for quick lookup
  const legacyByOwner = new Map<string, (typeof legacyTeamFormations)[number]>();
  for (const legacy of legacyTeamFormations) {
    if (!legacyByOwner.has(legacy.ownerId)) {
      legacyByOwner.set(legacy.ownerId, legacy);
    }
  }

  // Count not-started assignments
  let notStartedCount = 0;
  for (const assignment of assignments) {
    const hasSubmission = submissionSet.has(assignment.id);
    let teamFormation = assignment.teamFormationRequests[0];

    // Fallback for legacy data: use pre-fetched legacy team formation
    if (!teamFormation) {
      const legacy = legacyByOwner.get(assignment.createdById);
      if (legacy && (!assignment.startAt || legacy.createdAt >= assignment.startAt)) {
        teamFormation = legacy;
      }
    }

    const isInTeam = teamFormation?.teams.some((team: Team) =>
      team.members.some((m: TeamMember) => m.userId === userId),
    );

    const status = getStudentAssignmentStatus({
      assignmentStatus: assignment.status,
      hasSubmission,
      isInTeam: isInTeam ?? false,
    });

    if (status === "not-started") {
      notStartedCount++;
    }
  }

  return notStartedCount;
}

// Cache per user - userId is included in the key array
function getCachedNotStartedCount(userId: string) {
  return unstable_cache(() => fetchNotStartedCount(userId), ["sidebar-not-started-count", userId], {
    revalidate: 30,
    tags: [`sidebar-data-${userId}`],
  })();
}

export async function getSidebarData() {
  const user = await getCurrentUser();

  return getSidebarDataForUser(user);
}

export async function getSidebarDataForUser(user: SidebarUserInput | null): Promise<SidebarData> {
  if (!user) {
    return {
      user: null,
      notStartedCount: 0,
    };
  }

  const notStartedCount = user.role === "STUDENT" ? await getCachedNotStartedCount(user.id) : 0;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "unknown",
    },
    notStartedCount,
  };
}
