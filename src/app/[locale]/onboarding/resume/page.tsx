import { redirect } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/api-utils";
import { needsDataDiri } from "@/lib/authorization";
import { getUserPersonalitySessionStatus } from "@/lib/personality-session";
import prisma from "@/lib/prisma";
import SessionClearClient from "./session-clear-client";

export const dynamic = "force-dynamic";

export default async function ResumePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return <SessionClearClient />;
  }

  const markUserOnboarded = async () => {
    if (user.isOnboarded) return;
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnboarded: true },
    });
  };

  if (user.isOnboarded) {
    redirect({ href: "/dashboard?firstVisit=true", locale });
  }

  const isOnboardingRole = !user.role || user.role === "TEACHER" || user.role === "STUDENT";

  if (!isOnboardingRole) {
    redirect({ href: "/dashboard?firstVisit=true", locale });
  }

  if (!user.role) {
    redirect({ href: "/onboarding/role", locale });
  }

  const targetRole = user.role;
  if (!targetRole) {
    redirect({ href: "/onboarding/resume", locale });
  }

  const targetRoleSlug = targetRole === "TEACHER" ? "dosen" : "mahasiswa";

  const sessionStatus =
    targetRole === "STUDENT" ? await getUserPersonalitySessionStatus(user.id, locale) : null;

  if (needsDataDiri(user)) {
    redirect({ href: `/onboarding/data-diri/${targetRoleSlug}`, locale });
  }

  if (targetRole === "STUDENT") {
    if (!sessionStatus || sessionStatus.status !== "completed_valid") {
      redirect({ href: "/onboarding/kepribadian", locale });
    }

    await markUserOnboarded();

    redirect({ href: "/dashboard?firstVisit=true", locale });
  }

  // Mark user as onboarded before redirecting to dashboard
  await markUserOnboarded();

  redirect({ href: "/dashboard?firstVisit=true", locale });
}
