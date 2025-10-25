import { cookies, headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiResponse } from '@/lib/api-utils';
import { auth } from '@/lib/auth';
import { submitPersonalitySession } from '@/lib/personality-session';
// Prisma requires Node.js runtime
export const runtime = 'nodejs';

const personalitySchema = z.object({
  sessionId: z.string().uuid(),
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

    const { sessionId, answers } = personalitySchema.parse(body);

    // Get session
    const session = await auth.api.getSession({
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

    const result = await submitPersonalitySession({
      sessionId,
      userId: session.user.id,
      answers,
    });

    if (result.status !== 'completed' || !result.scores) {
      const errorMessage =
        result.status === 'attention_check_failed'
          ? 'Tes perhatian tidak lolos.'
          : result.status === 'speeding'
            ? 'Waktu pengerjaan terlalu singkat.'
            : 'Jawaban belum lengkap.';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    return createApiResponse({
      success: true,
      scores: result.scores,
      mbtiType: result.mbtiType,
    });
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.message : 'Internal server error';
    const status = e instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
