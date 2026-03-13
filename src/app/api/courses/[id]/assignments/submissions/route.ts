import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createErrorResponse, handleApiError, withAuth } from "@/lib/api-utils";
import { canAccessMahasiswaFeatures } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// DELETE /api/courses/[id]/assignments/submissions
// Optional query: ?assignmentId=...
export const DELETE = withAuth<{ id: string }>(async (request: NextRequest, { user, params }) => {
  try {
    const { id: courseId } = await params;

    // Only mahasiswa enrolled in the course can reset their submissions
    if (!canAccessMahasiswaFeatures(user)) {
      return createErrorResponse("Access denied", 403);
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId: user.id } },
    });
    if (!enrollment) return createErrorResponse("Course not found", 404);

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId") || undefined;

    // If assignmentId is provided, ensure it belongs to the course
    if (assignmentId) {
      const assignment = await prisma.assignment.findFirst({
        where: { id: assignmentId, courseId },
        select: { id: true },
      });
      if (!assignment) return createErrorResponse("Assignment not found", 404);
    }

    const deleted = await prisma.assignmentSubmission.deleteMany({
      where: {
        studentId: user.id,
        ...(assignmentId ? { assignmentId } : { assignment: { courseId } }),
      },
    });

    return NextResponse.json({ success: true, deleted: deleted.count });
  } catch (error) {
    return handleApiError(error);
  }
});
