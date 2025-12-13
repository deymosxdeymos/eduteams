import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { getStudentAssignmentStatus } from '@/lib/utils/student-status';

type TeamMember = { userId: string };
type TeamWithMembers = { members: TeamMember[] };

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'mahasiswa') {
      return NextResponse.json({ count: 0 });
    }

    // Get all courses the student is enrolled in
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: user.id },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((e: { courseId: string }) => e.courseId);

    if (courseIds.length === 0) {
      return NextResponse.json({ count: 0 });
    }

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

    type Assignment = (typeof assignments)[number];

    // Get all submissions for this student (excluding those that need updates)
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId: user.id,
        assignmentId: { in: assignments.map((a: Assignment) => a.id) },
        needsUpdate: false,
      },
      select: { assignmentId: true },
    });

    const submissionSet = new Set(
      submissions.map((s: { assignmentId: string }) => s.assignmentId)
    );

    // Batch fetch all legacy team formations to avoid N+1 query
    const assignmentsNeedingLegacy = assignments.filter(
      (a: Assignment) => a.teamFormationRequests.length === 0
    );
    const legacyTeamFormations =
      assignmentsNeedingLegacy.length > 0
        ? await prisma.teamFormationRequest.findMany({
            where: {
              ownerId: {
                in: assignmentsNeedingLegacy.map(
                  (a: Assignment) => a.createdById
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
    let notStartedCount = 0;
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

      const isInTeam = teamFormation?.teams.some((team: TeamWithMembers) =>
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

    return NextResponse.json({ count: notStartedCount });
  } catch (error) {
    console.error('Failed to get not-started count:', error);
    return NextResponse.json({ count: 0 });
  }
}
