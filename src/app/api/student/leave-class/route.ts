import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';

async function leaveClass(
  request: NextRequest,
  { user }: { user: ExtendedUser }
) {
  if (!canAccessMahasiswaFeatures(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { courseId } = await request.json();

  if (!courseId || typeof courseId !== 'string') {
    return NextResponse.json(
      { error: 'Course ID is required' },
      { status: 400 }
    );
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
      return NextResponse.json(
        { error: 'You are not enrolled in this class.' },
        { status: 404 }
      );
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
    revalidateTag(`courses-${enrollment.course.dosenId}`);
    revalidateTag(`student-classes-${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Successfully left ${enrollment.course.namaMataKuliah} - ${enrollment.course.kelas}`,
    });
  } catch (error) {
    console.error('Error leaving class:', error);
    return NextResponse.json(
      { error: 'Failed to leave class. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(leaveClass);
