import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  withAuth,
} from '@/lib/api-utils';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { isSameOrigin } from '@/lib/csrf';
import prisma from '@/lib/prisma';
import { limit, tooManyRequests } from '@/lib/rate-limit';
import type { ExtendedUser } from '@/lib/types';

// Prisma requires Node.js runtime
export const runtime = 'nodejs';

async function leaveClass(
  request: NextRequest,
  { user }: { user: ExtendedUser }
) {
  if (!canAccessMahasiswaFeatures(user)) {
    return createErrorResponse('Access denied', 403);
  }

  // Basic CSRF protection for browser-initiated POSTs
  if (!isSameOrigin(request)) {
    return createErrorResponse('Invalid origin', 403);
  }

  // Rate limit per user + endpoint
  const rl = await limit(request, `leave-class:${user.id}`);
  if (!rl.success) {
    return tooManyRequests(
      {},
      rl.retryAfter ? { 'Retry-After': String(rl.retryAfter) } : {}
    );
  }

  const { courseId } = await request.json();

  if (!courseId || typeof courseId !== 'string') {
    return createErrorResponse('Course ID is required', 400);
  }

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

export const POST = withAuth(leaveClass);
