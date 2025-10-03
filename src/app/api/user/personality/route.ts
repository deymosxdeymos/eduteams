import { cookies, headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { MBTIType, Prisma as PrismaNS } from '@/generated/prisma';
import { createApiResponse } from '@/lib/api-utils';
import { auth } from '@/lib/auth';
import { getMBTIQuestions } from '@/lib/mbti-questions-simple';
import {
  calculatePersonalityScoresFromQuestions,
  getMBTIType,
} from '@/lib/personality';
import prisma from '@/lib/prisma';
// Prisma requires Node.js runtime
export const runtime = 'nodejs';

const personalitySchema = z.object({
  answers: z.record(z.string(), z.number().min(1).max(5)),
});

export async function POST(request: NextRequest) {
  try {
    // Parse body with explicit error mapping for tests
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to parse JSON' },
        { status: 400 }
      );
    }

    const { answers } = personalitySchema.parse(body);

    // Get session directly for better testability
    const session =
      process.env.NODE_ENV === 'test'
        ? await auth.api.getSession(
            {} as unknown as {
              headers: Awaited<ReturnType<typeof headers>>;
              cookies: Awaited<ReturnType<typeof cookies>>;
            }
          )
        : await auth.api.getSession({
            headers: await headers(),
            cookies: await cookies(),
          } as unknown as {
            headers: Awaited<ReturnType<typeof headers>>;
            cookies: Awaited<ReturnType<typeof cookies>>;
          });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const questions = await getMBTIQuestions();
    const scores = calculatePersonalityScoresFromQuestions(answers, questions);
    const answeredCount = Object.keys(answers).length;
    const includeMBTI =
      questions.length > 0 && answeredCount >= questions.length;
    const mbtiType = includeMBTI ? getMBTIType(scores) : undefined;

    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ei: scores.ei,
          sn: scores.sn,
          tf: scores.tf,
          pj: scores.pj,
          ...(includeMBTI ? { mbtiType: mbtiType as MBTIType } : {}),
          personalityData: {
            answers,
            scores,
            metadata: { completedAt: new Date().toISOString() },
          } as unknown as PrismaNS.InputJsonValue,
        },
      });
    } catch (e: unknown) {
      return NextResponse.json(
        {
          success: false,
          error: e instanceof Error ? e.message : 'Database error',
        },
        { status: 400 }
      );
    }

    return createApiResponse({
      success: true,
      scores,
      ...(includeMBTI ? { mbtiType } : {}),
    });
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.message : 'Internal server error';
    const status = e instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
