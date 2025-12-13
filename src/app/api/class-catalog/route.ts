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
  createClassCatalogEntry,
  getClassCatalog,
} from '@/lib/data/class-catalog';

export const runtime = 'nodejs';

const classCatalogQuerySchema = z.object({
  search: z.string().trim().max(120, 'Search query is too long').optional(),
});

const classCatalogCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Class code is required')
    .max(32, 'Class code must be at most 32 characters long')
    .regex(
      /^[A-Za-z0-9-]+$/,
      'Class code can only contain letters, numbers, and dashes'
    ),
});

type ClassCatalogCreateInput = z.infer<typeof classCatalogCreateSchema>;

export const GET = withAuth(async (request: NextRequest, { user }) => {
  if (user.role !== 'dosen') {
    return createErrorResponse('Only dosen can view class catalog', 403);
  }

  const url = new URL(request.url);
  const parseResult = classCatalogQuerySchema.safeParse({
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
  const entries = await getClassCatalog({ search: search || undefined });

  return createApiResponse(entries);
});

export const POST = withAuth(
  withValidation(
    (data: unknown) => classCatalogCreateSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      if (user?.role !== 'dosen') {
        return createErrorResponse('Only dosen can create classes', 403);
      }

      const payload = validatedData as ClassCatalogCreateInput;
      const normalizedCode = payload.code.toUpperCase();

      try {
        const entry = await createClassCatalogEntry({
          code: normalizedCode,
        });

        return createApiResponse(entry, 'Class catalog entry created');
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return createErrorResponse('Class code already exists', 409);
        }
        throw error;
      }
    }
  )
);
