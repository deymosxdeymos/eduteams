import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
} from '@/lib/api-utils';
import { canAccessDosenFeatures } from '@/lib/authorization';
import { CACHE_TAGS } from '@/lib/cache-tags';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export const DELETE = withAuth<{ id: string; studentId: string }>(
  async (_request: NextRequest, { user, params }) => {
    try {
      if (!canAccessDosenFeatures(user))
        return createErrorResponse('Access denied', 403);

      const { id: courseId, studentId } = await params;

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

      revalidateTag(CACHE_TAGS.coursesByDosen(user.id));
      revalidateTag(CACHE_TAGS.studentClasses(studentId));

      return createApiResponse(
        { removed: true },
        'Mahasiswa dihapus dari kelas'
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
