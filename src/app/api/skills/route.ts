import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createApiResponse,
  createErrorResponse,
  withAuth,
} from '@/lib/api-utils';
import { canAccessDosenFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const SkillCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search =
    (searchParams.get('q') || searchParams.get('search'))?.trim() || '';
  const limit = Math.min(
    Number.parseInt(searchParams.get('limit') || '20', 10),
    100
  );

  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};

  const skills = await prisma.skill.findMany({
    where,
    select: { id: true, name: true, description: true },
    orderBy: { name: 'asc' },
    take: limit,
  });

  return createApiResponse(skills);
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  const isDosen = canAccessDosenFeatures(user);
  if (!isDosen) return createErrorResponse('Access denied', 403);

  const body = await request.json();
  const data = SkillCreateSchema.parse(body);

  const existing = await prisma.skill.findUnique({
    where: { name: data.name },
    select: { id: true },
  });

  if (existing) {
    return createErrorResponse('A skill with this name already exists', 409);
  }

  const skill = await prisma.skill.create({
    data: {
      name: data.name,
      description: data.description,
    },
    select: { id: true, name: true, description: true },
  });

  return NextResponse.json({ success: true, data: skill }, { status: 201 });
});
