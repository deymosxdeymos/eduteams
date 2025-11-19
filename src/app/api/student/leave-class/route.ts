import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createApiResponse,
  createErrorResponse,
  withAuth,
  withValidation,
} from '@/lib/api-utils';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { isSameOrigin } from '@/lib/csrf';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';

// Prisma requires Node.js runtime
export const runtime = 'nodejs';

const leaveClassSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

async function leaveClass(
  request: NextRequest,
  {
    user,
    validatedData,
  }: { user?: ExtendedUser; validatedData: { courseId: string } }
) {
  if (!user || !canAccessMahasiswaFeatures(user)) {
    return createErrorResponse('Access denied', 403);
  }

  // Basic CSRF protection for browser-initiated POSTs
  if (!isSameOrigin(request)) {
    return createErrorResponse('Invalid origin', 403);
  }

  const { courseId } = validatedData;

  try {
    // Check if enrollment exists
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: courseId,
          studentId: user.id,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            namaMataKuliah: true,
            kelas: true,
            dosenId: true,
          },
        },
      },
    });

    if (!enrollment) {
      return createErrorResponse('You are not enrolled in this class.', 404);
    }

    // Delete the enrollment
    await prisma.courseEnrollment.delete({
      where: {
        courseId_studentId: {
          courseId: courseId,
          studentId: user.id,
        },
      },
    });

    // Revalidate caches
    revalidateTag(CACHE_TAGS.coursesByDosen(enrollment.course.dosenId));
    revalidateTag(CACHE_TAGS.studentClasses(user.id));

    return createApiResponse({
      message: `Successfully left ${enrollment.course.namaMataKuliah} - ${enrollment.course.kelas}`,
    });
  } catch {
    return createErrorResponse('Failed to leave class. Please try again.', 500);
  }
}

export const POST = withAuth(
  withValidation((data: unknown) => leaveClassSchema.parse(data), leaveClass)
);
