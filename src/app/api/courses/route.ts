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
} from '@/lib/validations/course';

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

  const courses = await prisma.course.findMany({
    where: { dosenId: user?.id },
    include: {
      dosen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      enrollments: true, // Add enrollments to get student count
    },
    orderBy: { createdAt: 'desc' },
  });

  return createApiResponse(courses);
});
