import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Logo from "@/components/logo";
import RoleFormClient from "@/components/onboarding/role/role-form-client";
import { redirect } from "@/i18n/routing";
import { isActiveDemoAccountEmail } from "@/lib/demo/auth";
import { isInstitutionalEmail } from "@/lib/email";
import { getUserPersonalitySessionStatus } from "@/lib/personality-session";
import { protectOnboardingPage } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function RolePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("onboarding.role");
  const user = await protectOnboardingPage();
  const isDemoAccount = isActiveDemoAccountEmail(user.email);
  const hasTeacherAccess = isDemoAccount || isInstitutionalEmail(user.email);

  // Skip completion check in development if flag is set
  const devDisableAutoRole = process.env.DEV_DISABLE_AUTO_ROLE === "true";

  if (!devDisableAutoRole) {
    if (user.role === "TEACHER" && hasTeacherAccess) {
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
        hasInstitutionalEmail={hasTeacherAccess}
        enableDemoLogin={isDemoAccount}
      />
    </main>
  );
}
