import { createId } from '@paralleldrive/cuid2';
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
    if (user?.role !== 'dosen') {
      return createErrorResponse('Only dosen can access share tokens', 403);
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const courseId = pathSegments[pathSegments.length - 2];

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

export const POST = withAuth(
  async (request: NextRequest, { user }: { user: ExtendedUser }) => {
    if (user?.role !== 'dosen') {
      return createErrorResponse('Only dosen can regenerate share tokens', 403);
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const courseId = pathSegments[pathSegments.length - 2];

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
