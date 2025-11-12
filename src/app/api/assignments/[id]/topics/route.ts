import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
} from '@/lib/api-utils';
import { canAccessDosenFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const AssignmentTopicAddSchema = z.object({
  name: z.string().min(1).max(100),
});

// GET /api/assignments/[id]/topics
export const GET = withAuth<{ id: string }>(
  async (_request: NextRequest, { user, params }) => {
    try {
      const { id: assignmentId } = await params;

      const isDosen = canAccessDosenFeatures(user);
      if (!isDosen) return createErrorResponse('Access denied', 403);

      // Verify assignment exists and user owns the course
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: { course: { select: { dosenId: true } } },
      });

      if (!assignment) {
        return createErrorResponse('Assignment not found', 404);
      }
      if (assignment.course.dosenId !== user.id) {
        return createErrorResponse('Access denied', 403);
      }

      const topics = await prisma.assignmentTopic.findMany({
        where: { assignmentId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });

      return createApiResponse(topics);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// POST /api/assignments/[id]/topics (idempotent create)
export const POST = withAuth<{ id: string }>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id: assignmentId } = await params;

      const isDosen = canAccessDosenFeatures(user);
      if (!isDosen) return createErrorResponse('Access denied', 403);

      // Verify assignment exists and user owns the course
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: { course: { select: { dosenId: true } } },
      });

      if (!assignment) {
        return createErrorResponse('Assignment not found', 404);
      }
      if (assignment.course.dosenId !== user.id) {
        return createErrorResponse('Access denied', 403);
      }

      const body = await request.json();
      const data = AssignmentTopicAddSchema.parse(body);

      // Idempotent: find or create
      const existing = await prisma.assignmentTopic.findUnique({
        where: { assignmentId_name: { assignmentId, name: data.name } },
        select: { id: true, name: true },
      });

      if (existing) {
        return NextResponse.json(
          { success: true, data: existing },
          { status: 200 }
        );
      }

      const topic = await prisma.assignmentTopic.create({
        data: { assignmentId, name: data.name },
        select: { id: true, name: true },
      });

      return NextResponse.json({ success: true, data: topic }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
