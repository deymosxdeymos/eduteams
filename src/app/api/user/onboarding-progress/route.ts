import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  getCurrentUser,
  handleApiError,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { HttpError } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new HttpError(401, 'Unauthorized');
    }

    let body: { step?: string };
    try {
      body = await request.json();
    } catch {
      return handleApiError(new HttpError(500, 'Failed to update progress'));
    }

    const step = body?.step;

    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingStep: step },
    });

    return createApiResponse({ success: true });
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      return handleApiError(error);
    }

    return handleApiError(new HttpError(500, 'Failed to update progress'));
  }
}
