import { NextResponse } from 'next/server';
import { withRole } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/assignments/[id]/form-teams/status
// Returns the current status of team formation for an assignment
export const GET = withRole<{ id: string }>('dosen', async (_req, ctx) => {
  const startTime = performance.now();
  const params = await ctx.params;
  const assignmentId = params.id;

  console.log(`[Status Check] Starting for assignment: ${assignmentId}`);

  if (!assignmentId) {
    return NextResponse.json(
      { error: 'Assignment ID is required' },
      { status: 400 }
    );
  }

  // Verify assignment exists and belongs to current dosen
  const assignmentQueryStart = performance.now();
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      course: {
        select: { dosenId: true },
      },
    },
  });
  const assignmentQueryTime = performance.now() - assignmentQueryStart;
  console.log(
    `[Status Check] Assignment query took ${assignmentQueryTime.toFixed(2)}ms`
  );

  if (!assignment) {
    console.log(
      `[Status Check] Assignment not found. Total time: ${(performance.now() - startTime).toFixed(2)}ms`
    );
    return NextResponse.json(
      { error: 'Assignment not found' },
      { status: 404 }
    );
  }

  if (assignment.course.dosenId !== ctx.user.id) {
    console.log(
      `[Status Check] Unauthorized access. Total time: ${(performance.now() - startTime).toFixed(2)}ms`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Find the most recent team formation request for this assignment
  const statusQueryStart = performance.now();
  const latestRequest = await prisma.teamFormationRequest.findFirst({
    where: {
      assignmentId,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      status: true,
      errorMessage: true,
    },
  });
  const statusQueryTime = performance.now() - statusQueryStart;
  console.log(
    `[Status Check] Status query took ${statusQueryTime.toFixed(2)}ms`
  );

  const totalTime = performance.now() - startTime;
  console.log(
    `[Status Check] Total time: ${totalTime.toFixed(2)}ms | Status: ${latestRequest?.status || 'null'}`
  );

  if (!latestRequest) {
    return NextResponse.json({
      status: null,
      errorMessage: null,
    });
  }

  return NextResponse.json({
    status: latestRequest.status,
    errorMessage: latestRequest.errorMessage,
  });
});
