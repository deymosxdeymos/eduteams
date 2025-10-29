import { type NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, handleApiError } from '@/lib/api-utils';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import prisma from '@/lib/prisma';
import { HttpError } from '@/lib/types';

// Cache for 10 minutes since student lists don't change frequently
export const revalidate = 600;
// Prisma requires Node.js runtime
export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const isDosen = canAccessDosenFeatures(user);
    const isMahasiswa = canAccessMahasiswaFeatures(user);

    if (!isDosen && !isMahasiswa) {
      throw new HttpError(403, 'Access denied');
    }

    const { id: courseId } = await params;

    // Verify access to the course with a single optimized query
    let hasAccess = false;

    if (isDosen) {
      // Dosen can access their own courses - check in the main query
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          dosenId: user.id,
        },
        select: { id: true },
      });
      hasAccess = !!course;
    } else if (isMahasiswa) {
      // Students can access courses they're enrolled in - check in the main query
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          courseId: courseId,
          studentId: user.id,
        },
        select: { id: true },
      });
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      throw new HttpError(404, 'Course not found or access denied');
    }

    // Fetch all students enrolled in the course with optimized select
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId: courseId,
      },
      select: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            nimNpm: true,
            mbtiType: true,
            ei: true,
            sn: true,
            tf: true,
            pj: true,
          },
        },
        enrolledAt: true,
      },
      orderBy: {
        student: {
          name: 'asc',
        },
      },
    });

    const students = enrollments.map(enrollment => ({
      id: enrollment.student.id,
      name: enrollment.student.name || 'Unknown',
      nim: enrollment.student.nimNpm || 'N/A',
      email: enrollment.student.email || 'N/A',
      mbtiType: enrollment.student.mbtiType,
      ei: enrollment.student.ei,
      sn: enrollment.student.sn,
      tf: enrollment.student.tf,
      pj: enrollment.student.pj,
      enrolledAt: enrollment.enrolledAt,
    }));

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
