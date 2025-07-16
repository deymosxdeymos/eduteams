import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth, withValidation, createApiResponse } from '@/lib/api-utils';

const roleSchema = z.object({
  role: z.enum(['dosen', 'mahasiswa', 'admin']),
});

export const POST = withAuth(
  withValidation(
    (data: unknown) => roleSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      const { role } = validatedData;

      // Update user role in database
      await prisma.user.update({
        where: { id: user!.id },
        data: { role },
      });

      return createApiResponse({ success: true });
    }
  )
);
