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

    // Verify access first before fetching student data
    const [courseAccess, enrollmentAccess] = await Promise.all([
      // Dosen access check
      isDosen
        ? prisma.course.findUnique({
            where: { id: courseId, dosenId: user.id },
            select: { id: true },
          })
        : null,
      // Mahasiswa access check
      isMahasiswa
        ? prisma.courseEnrollment.findUnique({
            where: {
              courseId_studentId: { courseId, studentId: user.id },
            },
            select: { courseId: true },
          })
        : null,
    ]);

    const hasAccess = isDosen ? !!courseAccess : !!enrollmentAccess;
    if (!hasAccess) {
      throw new HttpError(404, 'Course not found or access denied');
    }

    // Only fetch students after access is validated
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      select: {
        enrolledAt: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            nim: true,
            personalityProfile: {
              select: {
                mbtiType: true,
                ei: true,
                sn: true,
                tf: true,
                pj: true,
              },
            },
          },
        },
      },
      orderBy: { student: { name: 'asc' } },
    });

    const students = enrollments.map(
      (enrollment: (typeof enrollments)[number]) => ({
        id: enrollment.student.id,
        name: enrollment.student.name || 'Unknown',
        nim: enrollment.student.nim || 'N/A',
        email: enrollment.student.email || 'N/A',
        mbtiType: enrollment.student.personalityProfile?.mbtiType ?? null,
        ei: enrollment.student.personalityProfile?.ei ?? null,
        sn: enrollment.student.personalityProfile?.sn ?? null,
        tf: enrollment.student.personalityProfile?.tf ?? null,
        pj: enrollment.student.personalityProfile?.pj ?? null,
        enrolledAt: enrollment.enrolledAt,
      })
    );

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
