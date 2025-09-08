import { NextResponse } from 'next/server';
import { handleApiError, withRole } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

// POST /api/assignments/[id]/reset-teams
export const POST = withRole<{ id: string }>('dosen', async (_req, ctx) => {
  try {
    const { id: assignmentId } = await ctx.params;

    // Verify assignment and ownership
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, course: { select: { dosenId: true } } },
    });
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }
    if (assignment.course.dosenId !== ctx.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Reset by moving the start window forward and clearing status
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { startAt: new Date(), status: 'MENUNGGU' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
