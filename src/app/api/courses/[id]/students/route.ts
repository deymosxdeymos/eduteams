import { type NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, handleApiError } from '@/lib/api-utils';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import prisma from '@/lib/prisma';
import { HttpError } from '@/lib/types';

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

    // Verify access to the course
    let hasAccess = false;

    if (isDosen) {
      // Dosen can access their own courses
      const course = await prisma.course.findUnique({
        where: {
          id: courseId,
          dosenId: user.id,
        },
      });
      hasAccess = !!course;
    } else if (isMahasiswa) {
      // Students can access courses they're enrolled in
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: courseId,
            studentId: user.id,
          },
        },
      });
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      throw new HttpError(404, 'Course not found or access denied');
    }

    // Fetch all students enrolled in the course
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            nimNpm: true,
          },
        },
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
