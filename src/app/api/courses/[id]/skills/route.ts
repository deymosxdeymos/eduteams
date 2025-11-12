import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
} from '@/lib/api-utils';
import { canAccessDosenFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const CourseSkillAddSchema = z.object({
  name: z.string().min(1).max(100),
});

// GET /api/courses/[id]/skills
export const GET = withAuth<{ id: string }>(
  async (_request: NextRequest, { user, params }) => {
    try {
      const { id: courseId } = await params;

      const isDosen = canAccessDosenFeatures(user);
      if (!isDosen) return createErrorResponse('Access denied', 403);

      // Verify course ownership
      const course = await prisma.course.findFirst({
        where: { id: courseId, dosenId: user.id },
        select: { id: true },
      });
      if (!course) return createErrorResponse('Course not found', 404);

      const courseSkills = await prisma.courseSkill.findMany({
        where: { courseId },
        select: {
          id: true,
          skill: { select: { id: true, name: true } },
        },
        orderBy: { skill: { name: 'asc' } },
      });

      const skills = courseSkills.map(cs => ({
        id: cs.skill.id,
        name: cs.skill.name,
      }));

      return createApiResponse(skills);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// POST /api/courses/[id]/skills (idempotent add)
export const POST = withAuth<{ id: string }>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id: courseId } = await params;

      const isDosen = canAccessDosenFeatures(user);
      if (!isDosen) return createErrorResponse('Access denied', 403);

      // Verify course ownership
      const course = await prisma.course.findFirst({
        where: { id: courseId, dosenId: user.id },
        select: { id: true },
      });
      if (!course) return createErrorResponse('Course not found', 404);

      const body = await request.json();
      const data = CourseSkillAddSchema.parse(body);

      // Ensure global Skill exists (create if not)
      let skill = await prisma.skill.findUnique({
        where: { name: data.name },
        select: { id: true, name: true },
      });

      if (!skill) {
        skill = await prisma.skill.create({
          data: { name: data.name },
          select: { id: true, name: true },
        });
      }

      // Idempotent: create CourseSkill if not exists
      const existing = await prisma.courseSkill.findUnique({
        where: { courseId_skillId: { courseId, skillId: skill.id } },
        select: { id: true },
      });

      if (!existing) {
        await prisma.courseSkill.create({
          data: { courseId, skillId: skill.id },
        });
      }

      return NextResponse.json(
        { success: true, data: { id: skill.id, name: skill.name } },
        { status: existing ? 200 : 201 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
