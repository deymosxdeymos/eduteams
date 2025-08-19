import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  withAuth,
} from '@/lib/api-utils';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';

// Cache for 10 minutes since course data doesn't change frequently
export const revalidate = 600;

type CourseWithDosen = {
  id: string;
  namaMataKuliah: string;
  kelas: string;
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  periode: string;
  dosenId: string;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  dosen: {
    id: string;
    name: string;
    email: string;
  };
};

export const GET = withAuth(
  async (request: NextRequest, { user }: { user: ExtendedUser }) => {
    const isDosen = canAccessDosenFeatures(user);
    const isMahasiswa = canAccessMahasiswaFeatures(user);

    if (!isDosen && !isMahasiswa) {
      return createErrorResponse('Access denied', 403);
    }

    // Extract params from the request URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    let course: CourseWithDosen | null = null;

    if (isDosen) {
      // Dosen can only access their own courses
      course = await prisma.course.findFirst({
        where: {
          id,
          dosenId: user?.id,
        },
        include: {
          dosen: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } else if (isMahasiswa) {
      // Students can only access courses they're enrolled in
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: id,
            studentId: user.id,
          },
        },
        include: {
          course: {
            include: {
              dosen: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
      course = enrollment?.course || null;
    }

    if (!course) {
      return createErrorResponse('Course not found', 404);
    }

    return createApiResponse(course);
  }
);
