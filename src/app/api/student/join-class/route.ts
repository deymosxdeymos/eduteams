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
import type { ExtendedUser } from '@/lib/types';

// Prisma requires Node.js runtime
export const runtime = 'nodejs';

async function joinClass(
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

  const { token } = await request.json();

  if (!token || typeof token !== 'string') {
    return createErrorResponse('Token is required', 400);
  }

  try {
    // Find the course by share token
    const course = await prisma.course.findUnique({
      where: {
        shareToken: token.trim(),
      },
      include: {
        dosen: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!course) {
      return createErrorResponse('Invalid token. Class not found.', 404);
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: course.id,
          studentId: user.id,
        },
      },
    });

    if (existingEnrollment) {
      return createErrorResponse(
        'You are already enrolled in this class.',
        409
      );
    }

    // Create enrollment
    await prisma.courseEnrollment.create({
      data: {
        courseId: course.id,
        studentId: user.id,
      },
    });

    // Revalidate the dosen's courses cache so student count updates
    revalidateTag(CACHE_TAGS.coursesByDosen(course.dosenId));

    return createApiResponse({
      message: `Successfully joined ${course.namaMataKuliah} - ${course.kelas}`,
      course: {
        id: course.id,
        namaMataKuliah: course.namaMataKuliah,
        kelas: course.kelas,
        tahunAwalPeriode: course.tahunAwalPeriode,
        tahunAkhirPeriode: course.tahunAkhirPeriode,
        dosen: course.dosen,
      },
    });
  } catch {
    return createErrorResponse('Failed to join class. Please try again.', 500);
  }
}

export const POST = withAuth(joinClass);
