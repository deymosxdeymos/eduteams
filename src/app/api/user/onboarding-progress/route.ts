import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  getCurrentUser,
  handleApiError,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { HttpError } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new HttpError(401, 'Unauthorized');
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return handleApiError(new HttpError(500, 'Failed to update progress'));
    }

    // Extract step from body, allowing any value including undefined/null
    const step = body?.step;

    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingStep: step },
    });

    return createApiResponse({ success: true });
  } catch (error) {
    // Handle authentication errors differently from other errors
    if (error instanceof HttpError && error.status === 401) {
      return handleApiError(error);
    }

    // Transform any database or other errors to "Failed to update progress"
    return handleApiError(new HttpError(500, 'Failed to update progress'));
  }
}
