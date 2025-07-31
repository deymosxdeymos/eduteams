import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';

async function getStudentClasses(
  _request: NextRequest,
  { user }: { user: ExtendedUser }
) {
  if (!canAccessMahasiswaFeatures(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Fetch enrolled courses for the student
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId: user.id,
      },
      include: {
        course: {
          include: {
            dosen: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { course: { tahunAwalPeriode: 'desc' } },
        { course: { periode: 'desc' } },
        { course: { namaMataKuliah: 'asc' } },
      ],
    });

    const courses = enrollments.map(enrollment => ({
      id: enrollment.course.id,
      namaMataKuliah: enrollment.course.namaMataKuliah,
      kelas: enrollment.course.kelas,
      tahunAwalPeriode: enrollment.course.tahunAwalPeriode,
      tahunAkhirPeriode: enrollment.course.tahunAkhirPeriode,
      periode: enrollment.course.periode,
      dosen: enrollment.course.dosen,
      enrolledAt: enrollment.enrolledAt,
    }));

    return NextResponse.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error('Error fetching student classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStudentClasses);
