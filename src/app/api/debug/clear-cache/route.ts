import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRole, withValidation } from '@/lib/api-utils';

const clearCacheSchema = z.object({
  tag: z.string().min(1, 'Tag is required'),
});

// Restrict to admins to prevent arbitrary cache invalidation
export const POST = withRole(
  'admin',
  withValidation(
    (data: unknown) => clearCacheSchema.parse(data),
    async (_request: NextRequest, { validatedData }) => {
      try {
        const { tag } = validatedData;

        revalidateTag(tag);

        return NextResponse.json({
          success: true,
          message: `Cache cleared for tag: ${tag}`,
        });
      } catch (error) {
        console.error('Error clearing cache:', error);
        return NextResponse.json(
          { error: 'Failed to clear cache' },
          { status: 500 }
        );
      }
    }
  )
);
