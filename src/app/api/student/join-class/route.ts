import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';

async function joinClass(
  request: NextRequest,
  { user }: { user: ExtendedUser }
) {
  if (!canAccessMahasiswaFeatures(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { token } = await request.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
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
      return NextResponse.json(
        { error: 'Invalid token. Class not found.' },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: 'You are already enrolled in this class.' },
        { status: 409 }
      );
    }

    // Create enrollment
    await prisma.courseEnrollment.create({
      data: {
        courseId: course.id,
        studentId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
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
  } catch (error) {
    console.error('Error joining class:', error);
    return NextResponse.json(
      { error: 'Failed to join class. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(joinClass);
