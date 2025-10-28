import { revalidateTag } from 'next/cache';
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
import { CACHE_TAGS } from '@/lib/cache-tags';
import { DASHBOARD_COURSES_TAG } from '@/lib/dashboard/courses';
import prisma from '@/lib/prisma';
import { courseUpdateSchema } from '@/lib/validation/course';

// Cache for 10 minutes since course data doesn't change frequently
export const revalidate = 600;
// Prisma requires Node.js runtime
export const runtime = 'nodejs';

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

export const GET = withAuth<{ id: string }>(
  async (_request: NextRequest, { user, params }) => {
    const isDosen = canAccessDosenFeatures(user);
    const isMahasiswa = canAccessMahasiswaFeatures(user);

    if (!isDosen && !isMahasiswa) {
      return createErrorResponse('Access denied', 403);
    }

    const { id } = await params;

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

export const PATCH = withAuth<{ id: string }>(
  async (request: NextRequest, { user, params }) => {
    if (!canAccessDosenFeatures(user)) {
      return createErrorResponse('Only dosen can update courses', 403);
    }

    const { id } = await params;

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (_error) {
      return createErrorResponse('Invalid JSON payload', 400);
    }

    const parsed = courseUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      const message =
        parsed.error.issues.map(issue => issue.message).join(', ') ||
        'Invalid course data';
      return createErrorResponse(message, 400);
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.namaMataKuliah !== undefined) {
      updateData.namaMataKuliah = data.namaMataKuliah;
    }
    if (data.kelas !== undefined) {
      updateData.kelas = data.kelas;
    }
    if (data.periode !== undefined) {
      updateData.periode = data.periode;
    }
    if (data.tahunAwalPeriode !== undefined) {
      updateData.tahunAwalPeriode = data.tahunAwalPeriode;
    }
    if (data.tahunAkhirPeriode !== undefined) {
      updateData.tahunAkhirPeriode = data.tahunAkhirPeriode;
    }

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No changes provided', 400);
    }

    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true, dosenId: true },
    });

    if (!course) {
      return createErrorResponse('Course not found', 404);
    }

    if (course.dosenId !== user.id) {
      return createErrorResponse('Access denied', 403);
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
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

    revalidateTag(DASHBOARD_COURSES_TAG);
    revalidateTag(CACHE_TAGS.coursesByDosen(user.id));

    return createApiResponse(updatedCourse);
  }
);
