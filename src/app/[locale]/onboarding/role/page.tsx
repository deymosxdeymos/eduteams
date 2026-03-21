import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Logo from "@/components/logo";
import RoleFormClient from "@/components/onboarding/role/role-form-client";
import { redirect } from "@/i18n/routing";
import { canStartTeacherOnboarding } from "@/lib/authorization";
import { INSTITUTIONAL_EMAIL_REQUIRED_ERROR } from "@/lib/onboarding/role-errors";
import { getUserPersonalitySessionStatus } from "@/lib/personality-session";
import { protectOnboardingPage } from "@/lib/server-auth";
import { isTruthyEnv } from "@/lib/utils/environment";

export const dynamic = "force-dynamic";

export default async function RolePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations("onboarding.role");
  const user = await protectOnboardingPage();

  // Skip completion check in development if flag is set
  const devDisableAutoRole = isTruthyEnv(process.env.DEV_DISABLE_AUTO_ROLE);

  if (!devDisableAutoRole) {
    if (user.role === "TEACHER") {
      // Dosen only needs name and gender (no NPM requirement)
      if (!user.name || !user.gender) {
        redirect({ href: "/onboarding/data-diri/dosen", locale });
      }
      redirect({ href: "/dashboard?firstVisit=true", locale });
    }

    if (user.role === "STUDENT") {
      // Mahasiswa needs NIM
      if (!user.nim) {
        redirect({ href: "/onboarding/data-diri/mahasiswa", locale });
      }

      const sessionStatus = await getUserPersonalitySessionStatus(user.id, locale);

      if (!sessionStatus || sessionStatus.status !== "completed_valid") {
        redirect({ href: "/onboarding/kepribadian", locale });
      }

      redirect({ href: "/dashboard?firstVisit=true", locale });
    }
  }

  return (
    <main className="bg-white min-h-screen p-12">
      <Logo color="black" className="justify-center" />

      <div className="flex items-center justify-center space-x-2 pt-20">
        <Image src="/emoji/grimming-face.svg" width={80} height={80} alt="question icon" />
        <h1 className="font-bold text-black text-6xl tracking-tighter">{t("title")}</h1>
      </div>

      <RoleFormClient
        initialRole={
          devDisableAutoRole ? undefined : (user.role as "dosen" | "mahasiswa" | undefined)
        }
        canChooseTeacher={canStartTeacherOnboarding(user)}
        initialShowDosenInvalid={error === INSTITUTIONAL_EMAIL_REQUIRED_ERROR}
      />
    </main>
  );
}
