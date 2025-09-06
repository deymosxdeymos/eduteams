import { NextResponse } from 'next/server';
import { createErrorResponse, handleApiError, withAuth } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { getAssignmentStats } from '@/lib/stats/assignment';

export const runtime = 'nodejs';

// GET /api/assignments/[id]/stats
export const GET = withAuth<{ id: string }>(async (_req, { params }) => {
  try {
    const { id: assignmentId } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, courseId: true },
    });
    if (!assignment) return createErrorResponse('Assignment not found', 404);

    const stats = await getAssignmentStats(assignmentId, assignment.courseId);

    // Optional: zero all values if teams are not formed yet
    const url = new URL(_req.url);
    const zeroIfNoTeams = url.searchParams.get('zeroIfNoTeams') === '1';
    const data =
      zeroIfNoTeams && !stats.teamsFormed
        ? {
            ...stats,
            mbti: stats.mbti.map(s => ({ ...s, jumlah: 0 })),
            gender: stats.gender.map(g => ({ ...g, value: 0 })),
            skills: stats.skills.map(s => ({ ...s, value: 0 })),
            topicPreferences: stats.topicPreferences.map(t => ({
              ...t,
              value: 0,
            })),
          }
        : stats;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
});
