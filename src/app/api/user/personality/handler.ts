import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiResponse, getCurrentUser } from "@/lib/api-utils";
import { submitPersonalitySession } from "@/lib/personality-session";
import type { ExtendedUser } from "@/lib/types";

const personalitySchema = z.object({
  sessionId: z.string().uuid(),
  answers: z.record(z.string(), z.number().min(1).max(5)),
});

type CurrentUserFetcher = () => Promise<ExtendedUser | null>;

type SubmitSessionFn = typeof submitPersonalitySession;

type PersonalityRouteDeps = {
  submitSession: SubmitSessionFn;
  getCurrentUser: CurrentUserFetcher;
};

const defaultDeps: PersonalityRouteDeps = {
  submitSession: submitPersonalitySession,
  getCurrentUser,
};

export function buildPersonalityHandler(overrides: Partial<PersonalityRouteDeps> = {}) {
  const deps = { ...defaultDeps, ...overrides };

  return async function POST(request: NextRequest) {
    try {
      // Parse body with explicit error mapping for tests
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { success: false, error: "Failed to parse JSON" },
          { status: 400 },
        );
      }

      const { sessionId, answers } = personalitySchema.parse(body);

      const user = await deps.getCurrentUser();

      if (!user) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 },
        );
      }

      const result = await deps.submitSession({
        sessionId,
        userId: user.id,
        answers,
      });

      if (result.status !== "completed" || !result.scores) {
        const errorMessage =
          result.status === "attention_check_failed"
            ? "Tes perhatian tidak lolos."
            : result.status === "speeding"
              ? "Waktu pengerjaan terlalu singkat."
              : "Jawaban belum lengkap.";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
      }

      return createApiResponse({
        success: true,
        scores: result.scores,
        mbtiType: result.mbtiType,
      });
    } catch (e) {
      const message = e instanceof z.ZodError ? e.message : "Internal server error";
      const status = e instanceof z.ZodError ? 400 : 500;
      return NextResponse.json({ success: false, error: message }, { status });
    }
  };
}
