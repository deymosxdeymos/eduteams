import { createId } from '@paralleldrive/cuid2';
import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  withAuth,
} from '@/lib/api-utils';
import { isSameOrigin } from '@/lib/csrf';
import prisma from '@/lib/prisma';

// Prisma requires Node.js runtime
export const runtime = 'nodejs';

export const GET = withAuth<{ id: string }>(
  async (_request: NextRequest, { user, params }) => {
    if (user?.role !== 'dosen') {
      return createErrorResponse('Only dosen can access share tokens', 403);
    }

    const { id: courseId } = await params;

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        dosenId: user?.id,
      },
      select: {
        id: true,
        shareToken: true,
        namaMataKuliah: true,
        kelas: true,
      },
    });

    if (!course) {
      return createErrorResponse('Course not found', 404);
    }

    let shareToken = course.shareToken;

    if (!shareToken) {
      shareToken = createId();
      await prisma.course.update({
        where: { id: courseId },
        data: { shareToken },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/join-class/${shareToken}`;

    return createApiResponse({
      token: shareToken,
      shareUrl,
      courseName: course.namaMataKuliah,
      className: course.kelas,
    });
  }
);

export const POST = withAuth<{ id: string }>(
  async (request: NextRequest, { user, params }) => {
    if (user?.role !== 'dosen') {
      return createErrorResponse('Only dosen can regenerate share tokens', 403);
    }

    // Basic CSRF protection for browser-initiated POSTs
    if (!isSameOrigin(request)) {
      return createErrorResponse('Invalid origin', 403);
    }

    const { id: courseId } = await params;

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        dosenId: user?.id,
      },
    });

    if (!course) {
      return createErrorResponse('Course not found', 404);
    }

    const newShareToken = createId();

    await prisma.course.update({
      where: { id: courseId },
      data: { shareToken: newShareToken },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/join-class/${newShareToken}`;

    return createApiResponse({
      token: newShareToken,
      shareUrl,
      courseName: course.namaMataKuliah,
      className: course.kelas,
    });
  }
);
