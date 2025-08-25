import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
} from '@/lib/api-utils';
import { canAccessDosenFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';

// Prisma requires Node.js runtime
export const runtime = 'nodejs';

// DELETE /api/courses/[id]/students/[studentId]
export const DELETE = withAuth(
  async (request: NextRequest, { user }: { user: ExtendedUser }) => {
    try {
      if (!canAccessDosenFeatures(user))
        return createErrorResponse('Access denied', 403);

      const url = new URL(request.url);
      const segments = url.pathname.split('/');
      const courseId = segments[segments.indexOf('courses') + 1];
      const studentId = segments[segments.indexOf('students') + 1];

      if (!courseId || !studentId)
        return createErrorResponse('Invalid path', 400);

      // Ensure this course belongs to the requesting dosen
      const course = await prisma.course.findFirst({
        where: { id: courseId, dosenId: user.id },
      });
      if (!course) return createErrorResponse('Course not found', 404);

      const enrollment = await prisma.courseEnrollment.findUnique({
        where: { courseId_studentId: { courseId, studentId } },
      });
      if (!enrollment)
        return createErrorResponse('Student not enrolled in this course', 404);

      await prisma.courseEnrollment.delete({
        where: { courseId_studentId: { courseId, studentId } },
      });

      // Revalidate caches for dosen courses view and student's classes view
      revalidateTag(`courses-${user.id}`);
      revalidateTag(`student-classes-${studentId}`);

      return createApiResponse(
        { removed: true },
        'Mahasiswa dihapus dari kelas'
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
