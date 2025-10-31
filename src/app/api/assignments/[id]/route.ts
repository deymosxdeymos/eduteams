import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createErrorResponse, handleApiError, withAuth } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { analyzeAssignmentEditImpact } from '@/lib/utils/assignment-change-detection';
import {
  createAssignmentSnapshot,
  invalidateAssignmentSubmissions,
  markSubmissionsNeedUpdate,
} from '@/lib/utils/assignment-snapshot';
import { AssignmentUpdateSchema } from '@/lib/validation/assignments';

export const runtime = 'nodejs';

// PATCH /api/assignments/[id]
export const PATCH = withAuth<{ id: string }>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id: assignmentId } = await params;

      // Load assignment with course, status, and version info
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: {
          id: true,
          courseId: true,
          title: true,
          description: true,
          status: true,
          structureVersion: true,
          course: { select: { dosenId: true } },
          _count: { select: { submissions: true } },
        },
      });
      if (!assignment) return createErrorResponse('Assignment not found', 404);
      if (assignment.course.dosenId !== user.id) {
        return createErrorResponse('Access denied', 403);
      }

      const body = await request.json();
      const input = AssignmentUpdateSchema.parse(body);

      // Clean skills/topics arrays
      const cleanedSkills = (input.skills || [])
        .map(s => s.trim())
        .filter(Boolean);
      const cleanedTopics = (input.topics || [])
        .map(t => t.trim())
        .filter(Boolean);

      // Analyze edit impact if skills/topics are being changed
      const hasStructuralEdit =
        input.skills !== undefined || input.topics !== undefined;

      let editTier = 1;
      if (hasStructuralEdit) {
        const impact = analyzeAssignmentEditImpact(
          assignment.description,
          cleanedSkills,
          cleanedTopics,
          assignment.status,
          assignment._count.submissions
        );
        editTier = impact.tier;

        // Tier 4: Block edits if teams are already formed
        if (editTier === 4) {
          return createErrorResponse(
            impact.reason ||
              'Cannot edit assignment structure after teams have been formed. Please reset the assignment first.',
            403
          );
        }

        // Tier 3: Require explicit confirmation for destructive changes
        if (editTier === 3 && !input.confirmDestructiveChanges) {
          return createErrorResponse(
            impact.reason ||
              'This edit will invalidate existing submissions. Please confirm by setting confirmDestructiveChanges to true.',
            400
          );
        }
      }

      // Build update data, merging skills/topics into description JSON
      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.startAt !== undefined) updateData.startAt = input.startAt;

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

      // Handle version tracking and submission updates based on tier
      if (hasStructuralEdit && editTier >= 2) {
        // Create snapshot before destructive changes (Tier 3)
        if (editTier === 3) {
          await createAssignmentSnapshot({
            assignmentId: assignment.id,
            version: assignment.structureVersion,
            title: assignment.title,
            description: assignment.description,
            reason: 'before_destructive_edit',
          });
        }

        // Increment structure version
        updateData.structureVersion = assignment.structureVersion + 1;
        updateData.structureUpdatedAt = new Date();

        // Handle submissions based on tier
        if (editTier === 3) {
          // Tier 3: Invalidate all submissions
          await invalidateAssignmentSubmissions(assignment.id);
        } else if (editTier === 2) {
          // Tier 2: Mark submissions as needing update
          await markSubmissionsNeedUpdate(
            assignment.id,
            assignment.structureVersion
          );
        }
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
          structureVersion: true,
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
          structureVersion: updated.structureVersion,
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
