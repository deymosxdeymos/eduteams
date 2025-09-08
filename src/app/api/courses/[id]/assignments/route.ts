import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
} from '@/lib/api-utils';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import prisma from '@/lib/prisma';
import { AssignmentCreateSchema } from '@/lib/validation/assignments';

// Prisma requires Node.js runtime
export const runtime = 'nodejs';

// GET /api/courses/[id]/assignments
export const GET = withAuth<{ id: string }>(
  async (_request: NextRequest, { user, params }) => {
    try {
      const { id: courseId } = await params;

      const isDosen = canAccessDosenFeatures(user);
      const isMahasiswa = canAccessMahasiswaFeatures(user);

      if (!isDosen && !isMahasiswa)
        return createErrorResponse('Access denied', 403);

      // Authorization: dosen must own the course; students must be enrolled
      if (isDosen) {
        const course = await prisma.course.findFirst({
          where: { id: courseId, dosenId: user.id },
        });
        if (!course) return createErrorResponse('Course not found', 404);
      } else if (isMahasiswa) {
        const enrollment = await prisma.courseEnrollment.findUnique({
          where: { courseId_studentId: { courseId, studentId: user.id } },
        });
        if (!enrollment) return createErrorResponse('Course not found', 404);
      }

      const rows = await prisma.assignment.findMany({
        where: { courseId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          courseId: true,
          title: true,
          description: true,
          startAt: true,
          createdAt: true,
          status: true,
          submissions: isMahasiswa
            ? {
                where: { studentId: user.id },
                select: { id: true },
              }
            : false,
          _count: { select: { submissions: true } },
        },
      });
      const assignments = rows.map(r => ({
        id: r.id,
        courseId: r.courseId,
        title: r.title,
        description: r.description ?? undefined,
        startAt: r.startAt,
        createdAt: r.createdAt,
        status: r.status,
        skills: [],
        topics: [],
        submissionsCount: r._count.submissions,
        submittedByMe: Array.isArray(r.submissions)
          ? (r.submissions as Array<{ id: string }>).length > 0
          : undefined,
      }));
      return createApiResponse(assignments);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// POST /api/courses/[id]/assignments
export const POST = withAuth<{ id: string }>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id: courseId } = await params;

      // Only dosen can create assignments for their course
      const isDosen = canAccessDosenFeatures(user);
      if (!isDosen) return createErrorResponse('Access denied', 403);

      const course = await prisma.course.findFirst({
        where: { id: courseId, dosenId: user.id },
      });
      if (!course) return createErrorResponse('Course not found', 404);

      const raw = await request.json();
      const data = AssignmentCreateSchema.parse(raw);

      // Persist skills/topics inside description JSON so downstream stats/UI can read them.
      const cleanedSkills = (data.skills || [])
        .map(s => s.trim())
        .filter(Boolean);
      const cleanedTopics = (data.topics || [])
        .map(t => t.trim())
        .filter(Boolean);
      const descJson: Record<string, unknown> = {};
      if (data.description && data.description.trim().length > 0) {
        descJson.text = data.description.trim();
      }
      if (cleanedSkills.length > 0) descJson.skills = cleanedSkills;
      if (cleanedTopics.length > 0) descJson.topics = cleanedTopics;
      const descriptionToStore =
        Object.keys(descJson).length > 0
          ? JSON.stringify(descJson)
          : data.description;

      const created = await prisma.assignment.create({
        data: {
          courseId,
          createdById: user.id,
          title: data.title,
          description: descriptionToStore,
          startAt: data.startAt ?? new Date(),
          status: 'BELUM_ISI',
        },
        select: {
          id: true,
          courseId: true,
          title: true,
          description: true,
          startAt: true,
          createdAt: true,
          status: true,
        },
      });
      return NextResponse.json(
        {
          success: true,
          data: {
            ...created,
            description: created.description ?? undefined,
            skills: cleanedSkills,
            topics: cleanedTopics,
            submissionsCount: 0,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
