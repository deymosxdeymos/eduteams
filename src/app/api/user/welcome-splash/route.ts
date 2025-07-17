import { NextRequest } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export const POST = withAuth(async (_request: NextRequest, { user }) => {
  await prisma.user.update({
    where: { id: user!.id },
    data: { hasSeenWelcomeSplash: true },
  });

  return createApiResponse({ success: true });
});
