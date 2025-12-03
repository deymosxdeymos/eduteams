import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createApiResponse, withAuth, withValidation } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const roleSchema = z.object({
  role: z.enum(['dosen', 'mahasiswa', 'admin']),
});

export const POST = withAuth(
  withValidation(
    (data: unknown) => roleSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      const { role } = validatedData;

      await prisma.user.update({
        where: { id: user.id },
        data: { role },
      });

      return createApiResponse({ success: true });
    }
  )
);
