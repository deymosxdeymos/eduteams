import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  withAuth,
  withValidation,
} from '@/lib/api-utils';
import { CACHE_TAGS } from '@/lib/cache-tags';

import { getCoursesForDosen } from '@/lib/dashboard/courses';
import prisma from '@/lib/prisma';
import { getCurrentAcademicYear } from '@/lib/utils/period';
import {
  type CourseCreateInput,
  type CourseCreateUserInput,
  courseCreateInputSchema,
} from '@/lib/validation/course';

export const runtime = 'nodejs';

export const POST = withAuth(
  withValidation(
    (data: unknown) => courseCreateInputSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      const userInput = validatedData as CourseCreateUserInput;

      if (user.role !== 'dosen') {
        return createErrorResponse('Only dosen can create courses', 403);
      }

      const academicYear = getCurrentAcademicYear();

      const courseData: CourseCreateInput = {
        ...userInput,
        tahunAwalPeriode: academicYear.tahunAwalPeriode,
        tahunAkhirPeriode: academicYear.tahunAkhirPeriode,
      };

      const course = await prisma.course.create({
        data: {
          ...courseData,
          dosenId: user.id,
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

      revalidateTag(CACHE_TAGS.coursesByDosen(user.id));

      return createApiResponse(course);
    }
  )
);

export const GET = withAuth(async (_request: NextRequest, { user }) => {
  if (user.role !== 'dosen') {
    return createErrorResponse('Only dosen can view courses', 403);
  }

  const courses = await getCoursesForDosen(user.id);

  return createApiResponse(courses);
});
