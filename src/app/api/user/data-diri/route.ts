import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createApiResponse, withAuth, withValidation } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
// Prisma requires Node.js runtime
export const runtime = 'nodejs';

const dataDiriSchema = z.object({
  namaLengkap: z.string().min(1, 'Nama lengkap is required'),
  nim: z.string().optional(),
  jenisKelamin: z.enum(['laki-laki', 'perempuan']),
  role: z.enum(['dosen', 'mahasiswa']),
});

export const GET = withAuth(async (_request: NextRequest, { user }) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: user?.id },
    select: {
      name: true,
      nim: true,
      role: true,
      gender: true,
    },
  });

  if (!currentUser) {
    return createApiResponse(null, 'User not found', 404);
  }

  // Convert enum to UI format
  const jenisKelamin =
    currentUser.gender === 'MALE'
      ? 'laki-laki'
      : currentUser.gender === 'FEMALE'
        ? 'perempuan'
        : '';

  return createApiResponse({
    namaLengkap: currentUser.name || '',
    nim: currentUser.nim || '',
    jenisKelamin,
    role: currentUser.role || '',
  });
});

export const POST = withAuth(
  withValidation(
    (data: unknown) => dataDiriSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      const { namaLengkap, nim, jenisKelamin, role } = validatedData;

      // Validate role-specific fields (only mahasiswa needs NIM, dosen doesn't need NPM)
      if (role === 'mahasiswa' && !nim) {
        return createApiResponse(null, 'NIM is required for mahasiswa', 400);
      }

      // Convert UI gender to enum
      const gender = jenisKelamin === 'laki-laki' ? 'MALE' : 'FEMALE';

      // Update user with data-diri information
      await prisma.user.update({
        where: { id: user?.id },
        data: {
          name: namaLengkap,
          nim: role === 'mahasiswa' ? nim : null, // Only mahasiswa has NIM
          role,
          gender,
          isOnboarded: role === 'dosen', // dosen is fully onboarded after data-diri
        },
      });

      return createApiResponse({ success: true });
    }
  )
);
