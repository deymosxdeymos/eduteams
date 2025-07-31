import { type NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { HttpError } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const { id: courseId } = await params;

    // Verify the course exists and user has access
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        dosenId: user.id,
      },
    });

    if (!course) {
      throw new HttpError(404, 'Course not found or access denied');
    }

    // TODO: Implement student enrollment system
    // For now, return empty array since we don't have a student enrollment system yet
    const students: Array<{
      id: string;
      name: string;
      nim: string;
      email: string;
    }> = [];

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
