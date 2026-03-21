import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiResponse, createErrorResponse, handleApiError, withAuth } from "@/lib/api-utils";
import { canAccessDosenFeatures } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const CourseSkillAddSchema = z.object({
  name: z.string().min(1).max(100),
});

// GET /api/courses/[id]/skills?q=term (also supports ?search=term)
export const GET = withAuth<{ id: string }>(async (request: NextRequest, { user, params }) => {
  try {
    const { id: courseId } = await params;
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("q") || searchParams.get("search"))?.trim() || "";

    const isDosen = canAccessDosenFeatures(user);
    if (!isDosen) return createErrorResponse("Access denied", 403);

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, dosenId: user.id },
      select: { id: true },
    });
    if (!course) return createErrorResponse("Course not found", 404);

    const where = search
      ? {
          courseId,
          skill: {
            name: { contains: search, mode: "insensitive" as const },
          },
        }
      : { courseId };

    const courseSkills = await prisma.courseSkill.findMany({
      where,
      select: {
        id: true,
        skill: { select: { id: true, name: true } },
      },
      orderBy: { skill: { name: "asc" } },
    });

    const skills = courseSkills.map((cs: (typeof courseSkills)[number]) => ({
      id: cs.skill.id,
      name: cs.skill.name,
    }));

    return createApiResponse(skills);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/courses/[id]/skills (idempotent add)
export const POST = withAuth<{ id: string }>(async (request: NextRequest, { user, params }) => {
  try {
    const { id: courseId } = await params;

    const isDosen = canAccessDosenFeatures(user);
    if (!isDosen) return createErrorResponse("Access denied", 403);

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, dosenId: user.id },
      select: { id: true },
    });
    if (!course) return createErrorResponse("Course not found", 404);

    const body = await request.json();
    const data = CourseSkillAddSchema.parse(body);

    // Upsert global Skill (race-safe)
    const skill = await prisma.skill.upsert({
      where: { name: data.name },
      update: {},
      create: { name: data.name },
      select: { id: true, name: true },
    });

    // Idempotent: link skill to course (race-safe)
    await prisma.courseSkill.upsert({
      where: { courseId_skillId: { courseId, skillId: skill.id } },
      update: {},
      create: { courseId, skillId: skill.id },
      select: { id: true },
    });

    return NextResponse.json(
      { success: true, data: { id: skill.id, name: skill.name } },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
});
