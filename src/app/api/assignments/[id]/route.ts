import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createErrorResponse, handleApiError, withAuth } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { AssignmentUpdateSchema } from '@/lib/validation/assignments';

export const runtime = 'nodejs';

// PATCH /api/assignments/[id]
export const PATCH = withAuth<{ id: string }>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id: assignmentId } = await params;

      // load assignment with course
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: {
          id: true,
          courseId: true,
          course: { select: { dosenId: true } },
        },
      });
      if (!assignment) return createErrorResponse('Assignment not found', 404);
      if (assignment.course.dosenId !== user.id) {
        return createErrorResponse('Access denied', 403);
      }

      const body = await request.json();
      const data = AssignmentUpdateSchema.parse(body);

      const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data,
        select: {
          id: true,
          courseId: true,
          title: true,
          description: true,
          startAt: true,
          createdAt: true,
          status: true,
          _count: { select: { submissions: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          courseId: updated.courseId,
          title: updated.title,
          description: updated.description ?? undefined,
          startAt: updated.startAt,
          createdAt: updated.createdAt,
          status: updated.status,
          skills: [],
          topics: [],
          submissionsCount: updated._count.submissions,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
