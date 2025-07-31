import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  withAuth,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';

export const GET = withAuth(
  async (request: NextRequest, { user }: { user: ExtendedUser }) => {
    // Only dosen can view their courses
    if (user?.role !== 'dosen') {
      return createErrorResponse('Only dosen can view courses', 403);
    }

    // Extract params from the request URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    const course = await prisma.course.findFirst({
      where: {
        id,
        dosenId: user?.id, // Ensure dosen can only access their own courses
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

    if (!course) {
      return createErrorResponse('Course not found', 404);
    }

    return createApiResponse(course);
  }
);
