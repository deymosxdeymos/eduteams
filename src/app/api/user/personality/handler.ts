import { cookies, headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiResponse } from '@/lib/api-utils';
import { auth } from '@/lib/auth';
import { submitPersonalitySession } from '@/lib/personality-session';

const personalitySchema = z.object({
  sessionId: z.string().uuid(),
  answers: z.record(z.string(), z.number().min(1).max(5)),
});

type SessionFetcher = (context: {
  headers: Awaited<ReturnType<typeof headers>>;
  cookies: Awaited<ReturnType<typeof cookies>>;
}) => Promise<{ user?: { id: string } } | null>;

type SubmitSessionFn = typeof submitPersonalitySession;

type PersonalityRouteDeps = {
  submitSession: SubmitSessionFn;
  getSession: SessionFetcher;
  getHeaders: typeof headers;
  getCookies: typeof cookies;
};

const defaultDeps: PersonalityRouteDeps = {
  submitSession: submitPersonalitySession,
  getSession: async context =>
    auth.api.getSession(
      context as unknown as {
        headers: Awaited<ReturnType<typeof headers>>;
        cookies: Awaited<ReturnType<typeof cookies>>;
      }
    ),
  getHeaders: headers,
  getCookies: cookies,
};

export function buildPersonalityHandler(
  overrides: Partial<PersonalityRouteDeps> = {}
) {
  const deps = { ...defaultDeps, ...overrides };

  return async function POST(request: NextRequest) {
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

      const usingDefaultSession = overrides.getSession === undefined;
      const context = usingDefaultSession
        ? {
            headers: await deps.getHeaders(),
            cookies: await deps.getCookies(),
          }
        : ({
            headers: undefined,
            cookies: undefined,
          } as unknown as {
            headers: Awaited<ReturnType<typeof headers>>;
            cookies: Awaited<ReturnType<typeof cookies>>;
          });

      const session = await deps.getSession(context);

      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      const result = await deps.submitSession({
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
  };
}
