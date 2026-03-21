import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createErrorResponse, withAuth } from "@/lib/api-utils";
import { parseAssignmentDescription } from "@/lib/assignment-description";
import prisma from "@/lib/prisma";
import { analyzeAssignmentEditImpact } from "@/lib/utils/assignment-change-detection";
import {
  ensureSkillsForCourse,
  ensureTopicsForAssignment,
} from "@/lib/utils/assignment-skills-topics";
import {
  createAssignmentSnapshot,
  invalidateAssignmentSubmissions,
  markSubmissionsNeedUpdate,
} from "@/lib/utils/assignment-snapshot";
import { AssignmentUpdateSchema, normalizeTagList } from "@/lib/validation/assignments";

export const runtime = "nodejs";

// PATCH /api/assignments/[id]
export const PATCH = withAuth<{ id: string }>(async (request: NextRequest, { user, params }) => {
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
  if (!assignment) return createErrorResponse("Assignment not found", 404);
  if (assignment.course.dosenId !== user.id) {
    return createErrorResponse("Access denied", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse("Invalid JSON payload", 400);
  }
  const input = AssignmentUpdateSchema.parse(body);

  const cleanedSkills = normalizeTagList(input.skills);
  const cleanedTopics = normalizeTagList(input.topics);

  // Analyze edit impact if skills/topics are being changed
  const hasStructuralEdit = input.skills !== undefined || input.topics !== undefined;

  let editTier = 1;
  if (hasStructuralEdit) {
    const impact = analyzeAssignmentEditImpact(
      assignment.description,
      cleanedSkills,
      cleanedTopics,
      assignment.status,
      assignment._count.submissions,
    );
    editTier = impact.tier;

    // Tier 4: Block edits if teams are already formed
    if (editTier === 4) {
      return createErrorResponse(
        impact.reason ||
          "Cannot edit assignment structure after teams have been formed. Please reset the assignment first.",
        403,
      );
    }

    // Tier 3: Require explicit confirmation for destructive changes
    if (editTier === 3 && !input.confirmDestructiveChanges) {
      return createErrorResponse(
        impact.reason ||
          "This edit will invalidate existing submissions. Please confirm by setting confirmDestructiveChanges to true.",
        400,
      );
    }
  }

  // Build update data, merging skills/topics into description JSON
  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.startAt !== undefined) updateData.startAt = input.startAt;

  // Preserve legacy plain-text descriptions while normalizing stored assignment metadata.
  const existingDescription = parseAssignmentDescription(assignment.description, {
    defaultSkills: [],
  });
  const descJson: Record<string, unknown> = {};
  if (existingDescription.text) descJson.text = existingDescription.text;
  if (existingDescription.skills.length > 0) descJson.skills = existingDescription.skills;
  if (existingDescription.topics.length > 0) descJson.topics = existingDescription.topics;
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
        reason: "before_destructive_edit",
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
      await markSubmissionsNeedUpdate(assignment.id, assignment.structureVersion);
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

  // Persist skills/topics if they were updated
  if (input.skills !== undefined || input.topics !== undefined) {
    await Promise.all([
      input.skills !== undefined
        ? ensureSkillsForCourse(assignment.courseId, cleanedSkills)
        : Promise.resolve(),
      input.topics !== undefined
        ? ensureTopicsForAssignment(assignmentId, cleanedTopics)
        : Promise.resolve(),
    ]);
  }

  const { skills, topics } = parseAssignmentDescription(updated.description, {
    defaultSkills: [],
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
      skills,
      topics,
      submissionsCount: updated._count.submissions,
    },
  });
});
