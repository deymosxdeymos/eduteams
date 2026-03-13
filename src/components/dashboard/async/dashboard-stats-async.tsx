import {
  EMPTY_DASHBOARD_STATISTICS,
  getDashboardStatisticsForUser,
} from "@/lib/dashboard/statistics";
import type { ExtendedUser } from "@/lib/types";

interface DashboardStatsAsyncProps {
  user: Pick<ExtendedUser, "id"> & Partial<Pick<ExtendedUser, "email">>;
}

async function _DashboardStatsAsync({ user }: DashboardStatsAsyncProps) {
  const statistics = await getDashboardStatisticsForUser(user);

  // Return statistics for use by parent component
  return statistics;
}

// Helper to get stats or return empty
export async function getStatsOrEmpty(
  user: (Pick<ExtendedUser, "id"> & Partial<Pick<ExtendedUser, "email">>) | null,
) {
  if (!user) return EMPTY_DASHBOARD_STATISTICS;
  return await getDashboardStatisticsForUser(user);
}
