import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { getStudentAssignmentStatus } from '@/lib/utils/student-status';

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

    const courseIds = enrollments.map(e => e.courseId);

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
        assignmentId: { in: assignments.map(a => a.id) },
        needsUpdate: false,
      },
      select: { assignmentId: true },
    });

    const submissionSet = new Set(submissions.map(s => s.assignmentId));

    // Count not-started assignments
    let notStartedCount = 0;
    for (const assignment of assignments) {
      const hasSubmission = submissionSet.has(assignment.id);
      let teamFormation = assignment.teamFormationRequests[0];

      // Fallback for legacy data: if no team formation found with assignmentId,
      // try to find the most recent completed team formation for this assignment's owner
      if (!teamFormation) {
        const legacyTeamFormation = await prisma.teamFormationRequest.findFirst(
          {
            where: {
              ownerId: assignment.createdById,
              assignmentId: null,
              status: 'COMPLETED',
            },
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
            orderBy: { createdAt: 'desc' },
          }
        );

        if (legacyTeamFormation) {
          teamFormation = legacyTeamFormation;
        }
      }

      const isInTeam = teamFormation?.teams.some(team =>
        team.members.some(m => m.userId === user.id)
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
