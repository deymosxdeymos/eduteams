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
          description: true,
          course: { select: { dosenId: true } },
        },
      });
      if (!assignment) return createErrorResponse('Assignment not found', 404);
      if (assignment.course.dosenId !== user.id) {
        return createErrorResponse('Access denied', 403);
      }

      const body = await request.json();
      const input = AssignmentUpdateSchema.parse(body);

      // Build update data, merging skills/topics into description JSON
      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.startAt !== undefined) updateData.startAt = input.startAt;

      const cleanedSkills = (input.skills || [])
        .map(s => s.trim())
        .filter(Boolean);
      const cleanedTopics = (input.topics || [])
        .map(t => t.trim())
        .filter(Boolean);

      // Merge with existing description JSON if present
      let descJson: Record<string, unknown> = {};
      try {
        if (assignment.description) {
          const parsed = JSON.parse(assignment.description);
          if (parsed && typeof parsed === 'object')
            descJson = parsed as Record<string, unknown>;
        }
      } catch {}
      if (input.description !== undefined) descJson.text = input.description;
      if (input.skills !== undefined) descJson.skills = cleanedSkills;
      if (input.topics !== undefined) descJson.topics = cleanedTopics;
      if (Object.keys(descJson).length > 0) {
        updateData.description = JSON.stringify(descJson);
      }

      const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: updateData,
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
          // surface skills/topics from description JSON if present
          ...((): { skills: string[]; topics: string[] } => {
            try {
              if (!updated.description) return { skills: [], topics: [] };
              const parsed = JSON.parse(updated.description);
              const skills = Array.isArray(parsed?.skills)
                ? (parsed.skills as string[])
                : [];
              const topics = Array.isArray(parsed?.topics)
                ? (parsed.topics as string[])
                : [];
              return { skills, topics };
            } catch {
              return { skills: [], topics: [] };
            }
          })(),
          submissionsCount: updated._count.submissions,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
