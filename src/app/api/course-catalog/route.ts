import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import {
  createApiResponse,
  createErrorResponse,
  withAuth,
  withValidation,
} from '@/lib/api-utils';
import {
  createCourseCatalogEntry,
  getCourseCatalog,
} from '@/lib/data/course-catalog';

export const runtime = 'nodejs';

const courseCatalogQuerySchema = z.object({
  search: z.string().trim().max(120, 'Search query is too long').optional(),
});

const courseCatalogCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Course code is required')
    .max(32, 'Course code must be at most 32 characters long')
    .regex(
      /^[A-Za-z0-9-]+$/,
      'Course code can only contain letters, numbers, and dashes'
    ),
  name: z
    .string()
    .trim()
    .min(3, 'Course name is required')
    .max(160, 'Course name must be at most 160 characters long'),
});

type CourseCatalogCreateInput = z.infer<typeof courseCatalogCreateSchema>;

export const GET = withAuth(async (request: NextRequest, { user }) => {
  if (user.role !== 'TEACHER') {
    return createErrorResponse('Only dosen can view course catalog', 403);
  }

  const url = new URL(request.url);
  const parseResult = courseCatalogQuerySchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
  });

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    return createErrorResponse(
      firstError?.message || 'Invalid search query',
      400
    );
  }

  const { search } = parseResult.data;
  const entries = await getCourseCatalog({ search: search || undefined });

  return createApiResponse(entries);
});

export const POST = withAuth(
  withValidation(
    (data: unknown) => courseCatalogCreateSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      if (user?.role !== 'TEACHER') {
        return createErrorResponse('Only dosen can create courses', 403);
      }

      const payload = validatedData as CourseCatalogCreateInput;
      const normalizedCode = payload.code.toUpperCase();
      const normalizedName = payload.name.replace(/\s+/g, ' ').trim();

      try {
        const entry = await createCourseCatalogEntry({
          code: normalizedCode,
          name: normalizedName,
        });

        return createApiResponse(entry, 'Course catalog entry created');
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return createErrorResponse('Course code already exists', 409);
        }
        throw error;
      }
    }
  )
);
