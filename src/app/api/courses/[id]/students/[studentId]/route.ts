import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { createApiResponse, createErrorResponse, handleApiError, withAuth } from "@/lib/api-utils";
import { canAccessDosenFeatures } from "@/lib/authorization";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  DEMO_COURSE_ID,
  DEMO_STUDENT_ID,
  DEMO_TEACHER_ID,
  getDemoSandboxPrincipalId,
  getDemoStudentsForCourse,
} from "@/lib/demo/sandbox";
import {
  getRemovedDemoStudentIdsFromRequest,
  removeDemoSandboxStudentFromRoster,
} from "@/lib/demo/sandbox-roster";
import prisma from "@/lib/prisma";

// Prisma requires Node.js runtime
export const runtime = "nodejs";

// DELETE /api/courses/[id]/students/[studentId]
export const DELETE = withAuth<{ id: string; studentId: string }>(
  async (request: NextRequest, { user, params }) => {
    try {
      if (!canAccessDosenFeatures(user)) return createErrorResponse("Access denied", 403);

      const { id: courseId, studentId } = await params;

      if (!courseId || !studentId) return createErrorResponse("Invalid path", 400);

      if (courseId === DEMO_COURSE_ID) {
        if (getDemoSandboxPrincipalId(user) !== DEMO_TEACHER_ID) {
          return createErrorResponse("Course not found", 404);
        }

        if (studentId === DEMO_STUDENT_ID) {
          return createErrorResponse("The required demo student cannot be removed", 403);
        }

        const removedStudentIds = new Set(getRemovedDemoStudentIdsFromRequest(request));
        const isEnrolledDemoStudent =
          getDemoStudentsForCourse().some((student) => student.id === studentId) &&
          !removedStudentIds.has(studentId);
        if (!isEnrolledDemoStudent) {
          return createErrorResponse("Student not enrolled in this course", 404);
        }

        const response = createApiResponse({ removed: true }, "Mahasiswa dihapus dari kelas");
        removeDemoSandboxStudentFromRoster(response, request, studentId);

        return response;
      }

      // Ensure this course belongs to the requesting dosen
      const course = await prisma.course.findFirst({
        where: { id: courseId, dosenId: user.id },
      });
      if (!course) return createErrorResponse("Course not found", 404);

      const enrollment = await prisma.courseEnrollment.findUnique({
        where: { courseId_studentId: { courseId, studentId } },
      });
      if (!enrollment) return createErrorResponse("Student not enrolled in this course", 404);

      await prisma.courseEnrollment.delete({
        where: { courseId_studentId: { courseId, studentId } },
      });

      // Revalidate caches for dosen courses view and student's classes view
      revalidateTag(CACHE_TAGS.coursesByDosen(user.id));
      revalidateTag(CACHE_TAGS.studentClasses(studentId));

      return createApiResponse({ removed: true }, "Mahasiswa dihapus dari kelas");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowDemoSandbox: true },
);
