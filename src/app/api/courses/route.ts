import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import enMessages from '@/../messages/en.json';
import idMessages from '@/../messages/id.json';
import { routing } from '@/i18n/routing';
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

function getLocaleFromRequest(request: NextRequest): 'id' | 'en' {
  const referer = request.headers.get('referer');
  if (referer?.includes('/en/')) {
    return 'en';
  }

  return (routing.defaultLocale ?? 'id') as 'id' | 'en';
}

function getLocalizedMessage(locale: 'id' | 'en', key: string): string {
  const messages = locale === 'en' ? enMessages : idMessages;
  const keys = key.split('.');
  let value: Record<string, unknown> | string = messages;
  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k] as
      | Record<string, unknown>
      | string;
  }
  return typeof value === 'string' ? value : key;
}

// Prisma requires Node.js runtime
export const runtime = 'nodejs';

export const POST = withAuth(
  withValidation(
    (data: unknown) => courseCreateInputSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      const userInput = validatedData as CourseCreateUserInput;

      // Only dosen can create courses
      if (user?.role !== 'dosen') {
        return createErrorResponse('Only dosen can create courses', 403);
      }

      // Auto-detect current academic year
      const academicYear = getCurrentAcademicYear();

      // Merge user input with auto-detected academic year
      const courseData: CourseCreateInput = {
        ...userInput,
        tahunAwalPeriode: academicYear.tahunAwalPeriode,
        tahunAkhirPeriode: academicYear.tahunAkhirPeriode,
      };

      // Check for duplicate course (same name, class, year, period for same dosen)
      const existingCourse = await prisma.course.findFirst({
        where: {
          dosenId: user?.id,
          namaMataKuliah: courseData.namaMataKuliah,
          kelas: courseData.kelas,
          tahunAwalPeriode: courseData.tahunAwalPeriode,
          tahunAkhirPeriode: courseData.tahunAkhirPeriode,
          periode: courseData.periode,
          archivedAt: null,
        },
      });

      if (existingCourse) {
        const locale = getLocaleFromRequest(_request);
        const errorMessage = getLocalizedMessage(
          locale,
          'dashboard.modals.createClass.duplicateError'
        );
        return createErrorResponse(errorMessage, 409);
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

      revalidateTag(CACHE_TAGS.coursesByDosen(user?.id || ''));

      return createApiResponse(course);
    }
  )
);

export const GET = withAuth(async (_request: NextRequest, { user }) => {
  // Only dosen can view their courses
  if (user?.role !== 'dosen') {
    return createErrorResponse('Only dosen can view courses', 403);
  }

  const courses = await getCoursesForDosen(user.id);

  return createApiResponse(courses);
});
