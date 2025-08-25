import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createErrorResponse, handleApiError, withAuth } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';

export const runtime = 'nodejs';

// POST /api/assignments/[id]/submissions
export const POST = withAuth(
  async (request: NextRequest, { user }: { user: ExtendedUser }) => {
    try {
      const url = new URL(request.url);
      const segments = url.pathname.split('/');
      const assignmentId = segments[segments.indexOf('assignments') + 1];

      // Load assignment and ensure user is enrolled in course
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: { id: true, courseId: true },
      });
      if (!assignment) return createErrorResponse('Assignment not found', 404);

      const enrolled = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: assignment.courseId,
            studentId: user.id,
          },
        },
      });
      if (!enrolled) return createErrorResponse('Access denied', 403);

      // Idempotent create: unique constraint prevents duplicates
      await prisma.assignmentSubmission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId: assignment.id,
            studentId: user.id,
          },
        },
        update: {},
        create: { assignmentId: assignment.id, studentId: user.id },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// DELETE /api/assignments/[id]/submissions
export const DELETE = withAuth(
  async (request: NextRequest, { user }: { user: ExtendedUser }) => {
    try {
      const url = new URL(request.url);
      const segments = url.pathname.split('/');
      const assignmentId = segments[segments.indexOf('assignments') + 1];

      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: { id: true, courseId: true },
      });
      if (!assignment) return createErrorResponse('Assignment not found', 404);

      const enrolled = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: assignment.courseId,
            studentId: user.id,
          },
        },
      });
      if (!enrolled) return createErrorResponse('Access denied', 403);

      await prisma.assignmentSubmission.deleteMany({
        where: { assignmentId: assignment.id, studentId: user.id },
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
