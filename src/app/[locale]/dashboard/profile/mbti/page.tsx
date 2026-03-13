import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function MBTIOverviewPage() {
  // This route is deprecated. Redirect to profile where MBTI is shown in a modal.
  redirect("/dashboard/profile");
}
