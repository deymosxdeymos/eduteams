"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/routing";
import type { MBTIType } from "@/generated/prisma/client";
import type { RequestLocale } from "@/lib/api-i18n";
import { getCurrentUser } from "@/lib/api-utils";
import { needsDataDiri } from "@/lib/authorization";
import { isActiveDemoAccountEmail } from "@/lib/demo/auth";
import { isDemoModeEnabled } from "@/lib/demo/config";
import { refreshDemoSandboxSessionCookie } from "@/lib/demo/sandbox-cookie";
import prisma from "@/lib/prisma";
import { AuthError } from "@/lib/types";

// Map MBTI types to approximate axis scores
const MBTI_SCORES: Record<string, { ei: number; sn: number; tf: number; pj: number }> = {
  INTJ: { ei: -0.7, sn: -0.6, tf: -0.5, pj: 0.7 },
  INTP: { ei: -0.7, sn: -0.6, tf: -0.5, pj: -0.7 },
  ENTJ: { ei: 0.7, sn: -0.6, tf: -0.5, pj: 0.7 },
  ENTP: { ei: 0.7, sn: -0.6, tf: -0.5, pj: -0.7 },
  INFJ: { ei: -0.7, sn: -0.6, tf: 0.5, pj: 0.7 },
  INFP: { ei: -0.7, sn: -0.6, tf: 0.5, pj: -0.7 },
  ENFJ: { ei: 0.7, sn: -0.6, tf: 0.5, pj: 0.7 },
  ENFP: { ei: 0.7, sn: -0.6, tf: 0.5, pj: -0.7 },
  ISTJ: { ei: -0.7, sn: 0.6, tf: -0.5, pj: 0.7 },
  ISFJ: { ei: -0.7, sn: 0.6, tf: 0.5, pj: 0.7 },
  ESTJ: { ei: 0.7, sn: 0.6, tf: -0.5, pj: 0.7 },
  ESFJ: { ei: 0.7, sn: 0.6, tf: 0.5, pj: 0.7 },
  ISTP: { ei: -0.7, sn: 0.6, tf: -0.5, pj: -0.7 },
  ISFP: { ei: -0.7, sn: 0.6, tf: 0.5, pj: -0.7 },
  ESTP: { ei: 0.7, sn: 0.6, tf: -0.5, pj: -0.7 },
  ESFP: { ei: 0.7, sn: 0.6, tf: 0.5, pj: -0.7 },
};

export async function submitDemoPersonality(mbtiType: string, locale: RequestLocale) {
  if (!isDemoModeEnabled()) {
    throw new Error("Demo mode is not enabled");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Authentication required");
  }

  if (!isActiveDemoAccountEmail(user.email)) {
    throw new AuthError("Demo account required");
  }

  if (!user.role) {
    redirect({ href: "/onboarding/role", locale });
  }

  if (user.role === "TEACHER") {
    redirect({
      href: needsDataDiri(user) ? "/onboarding/data-diri/dosen" : "/onboarding/resume",
      locale,
    });
  }

  if (user.role !== "STUDENT") {
    redirect({ href: "/dashboard", locale });
  }

  if (needsDataDiri(user)) {
    redirect({ href: "/onboarding/data-diri/mahasiswa", locale });
  }

  if (user.isOnboarded) {
    redirect({ href: "/dashboard?firstVisit=true", locale });
  }

  const scores = MBTI_SCORES[mbtiType];
  if (!scores) {
    throw new Error("Invalid MBTI type");
  }

  await prisma.personalityProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ei: scores.ei,
      sn: scores.sn,
      tf: scores.tf,
      pj: scores.pj,
      mbtiType: mbtiType as MBTIType,
    },
    update: {
      ei: scores.ei,
      sn: scores.sn,
      tf: scores.tf,
      pj: scores.pj,
      mbtiType: mbtiType as MBTIType,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isOnboarded: true,
      onboardingStep: null,
    },
  });
  await refreshDemoSandboxSessionCookie(user, {
    role: "STUDENT",
    onboarded: true,
  });

  revalidatePath("/dashboard");
  if (locale === "en") {
    revalidatePath("/en/dashboard");
  }

  redirect({ href: "/dashboard?firstVisit=true", locale });
}
