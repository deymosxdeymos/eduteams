import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ManageLayout } from "@/components/dashboard/manage-layout";
import { CourseListSkeleton } from "@/components/ui/skeletons/course-list-skeleton";
import { canAccessDosenFeatures, canAccessMahasiswaFeatures } from "@/lib/authorization";
import { protectDashboard } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.sidebar");
  return {
    title: `${t("manage")} - EduTeams`,
    description: "Manage dashboard features for lecturers and students.",
  };
}

export default async function ManagePage() {
  const user = await protectDashboard();

  if (!canAccessDosenFeatures(user) && !canAccessMahasiswaFeatures(user)) {
    redirect("/dashboard");
  }

  return (
    <DashboardClient shouldShowSplash={false} isFirstVisit={false}>
      <Suspense fallback={<CourseListSkeleton />}>
        <ManageLayout user={user} />
      </Suspense>
    </DashboardClient>
  );
}
