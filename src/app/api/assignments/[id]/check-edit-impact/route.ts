import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse, handleApiError, withAuth } from "@/lib/api-utils";
import prisma from "@/lib/prisma";
import { analyzeAssignmentEditImpact } from "@/lib/utils/assignment-change-detection";

export const runtime = "nodejs";

const CheckEditImpactSchema = z.object({
  skills: z.array(z.string()),
  topics: z.array(z.string()),
});

// POST /api/assignments/[id]/check-edit-impact
export const POST = withAuth<{ id: string }>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id: assignmentId } = await params;

      // Load assignment with course and submission count
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: {
          id: true,
          courseId: true,
          description: true,
          status: true,
          course: { select: { dosenId: true } },
          _count: { select: { submissions: true } },
        },
      });

      if (!assignment) return createErrorResponse("Assignment not found", 404);

      // Only course owner (dosen) can check edit impact
      if (assignment.course.dosenId !== user.id) {
        return createErrorResponse("Access denied", 403);
      }

      const body = await request.json();
      const input = CheckEditImpactSchema.parse(body);

      // Clean input arrays
      const cleanedSkills = input.skills.map((s) => s.trim()).filter(Boolean);
      const cleanedTopics = input.topics.map((t) => t.trim()).filter(Boolean);

      // Analyze edit impact
      const impact = analyzeAssignmentEditImpact(
        assignment.description,
        cleanedSkills,
        cleanedTopics,
        assignment.status,
        assignment._count.submissions,
      );

      return NextResponse.json({
        success: true,
        data: impact,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowDemoSandbox: true },
);
