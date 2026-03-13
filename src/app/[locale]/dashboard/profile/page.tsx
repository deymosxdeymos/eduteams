import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ProfileLayout } from "@/components/dashboard/profile-layout";
import { protectDashboard } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Profil - EduTeams",
    description: "Kelola profil dan pengaturan akun Anda",
  };
}

export default async function ProfilePage() {
  const user = await protectDashboard();

  return (
    <DashboardClient shouldShowSplash={false} isFirstVisit={false}>
      <ProfileLayout user={user} />
    </DashboardClient>
  );
}
