"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/lib/api-utils";
import {
  createPersonalitySessionForUser,
  getUserPersonalitySessionStatus,
  submitPersonalitySession,
} from "@/lib/personality-session";
import { AuthError, ValidationError } from "@/lib/types";

const personalitySubmissionSchema = z.object({
  sessionId: z.string().uuid(),
  answers: z.record(z.string(), z.number().int().min(1).max(5)),
});

export async function ensurePersonalitySession(locale?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Authentication required");
  }
  const session = await createPersonalitySessionForUser(user, locale);
  if (!session) {
    const status = await getUserPersonalitySessionStatus(user.id, locale);
    if (status?.status === "completed_valid") {
      redirect("/dashboard?firstVisit=true");
    }
    throw new ValidationError("Personality questionnaire is not available");
  }
  return session;
}

export async function submitPersonalityTest(
  formData: FormData,
  getCurrentUserImpl?: typeof getCurrentUser,
) {
  const resolveUser = getCurrentUserImpl ?? getCurrentUser;
  const user = await resolveUser();
  if (!user) {
    throw new AuthError("Authentication required");
  }

  const answersJson = formData.get("answers");
  const sessionId = formData.get("sessionId");

  if (typeof answersJson !== "string" || typeof sessionId !== "string") {
    throw new ValidationError("Jawaban dan sesi wajib diisi");
  }

  const parsedData = personalitySubmissionSchema.parse({
    sessionId,
    answers: JSON.parse(answersJson),
  });

  const result = await submitPersonalitySession({
    sessionId: parsedData.sessionId,
    userId: user.id,
    answers: parsedData.answers,
  });

  if (result.status === "attention_check_failed") {
    throw new ValidationError("Tes perhatian tidak lolos. Ikuti instruksi dan coba lagi.");
  }
  if (result.status === "speeding") {
    throw new ValidationError("Waktu pengerjaan terlalu singkat. Mohon isi dengan lebih teliti.");
  }
  if (result.status === "incomplete") {
    throw new ValidationError("Lengkapi semua pernyataan sebelum mengirim.");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?firstVisit=true");
}
