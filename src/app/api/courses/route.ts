import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  withAuth,
  withValidation,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import {
  type CourseCreateInput,
  courseCreateSchema,
} from '@/lib/validation/course';

// Prisma requires Node.js runtime
export const runtime = 'nodejs';

export const POST = withAuth(
  withValidation(
    (data: unknown) => courseCreateSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      const courseData = validatedData as CourseCreateInput;

      // Only dosen can create courses
      if (user?.role !== 'dosen') {
        return createErrorResponse('Only dosen can create courses', 403);
      }

      // Create course in database
      const course = await prisma.course.create({
        data: {
          ...courseData,
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

      return createApiResponse(course);
    }
  )
);

export const GET = withAuth(async (_request: NextRequest, { user }) => {
  // Only dosen can view their courses
  if (user?.role !== 'dosen') {
    return createErrorResponse('Only dosen can view courses', 403);
  }

  const rows = await prisma.course.findMany({
    where: { dosenId: user?.id },
    select: {
      id: true,
      namaMataKuliah: true,
      kelas: true,
      tahunAwalPeriode: true,
      tahunAkhirPeriode: true,
      periode: true,
      dosenId: true,
      shareToken: true,
      createdAt: true,
      updatedAt: true,
      dosen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const courses = rows.map(r => ({
    id: r.id,
    namaMataKuliah: r.namaMataKuliah,
    kelas: r.kelas,
    tahunAwalPeriode: r.tahunAwalPeriode,
    tahunAkhirPeriode: r.tahunAkhirPeriode,
    periode: r.periode,
    dosenId: r.dosenId,
    shareToken: r.shareToken,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    dosen: r.dosen,
    studentCount: r._count.enrollments,
  }));

  return createApiResponse(courses);
});
