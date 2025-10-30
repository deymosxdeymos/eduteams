import {
  EMPTY_DASHBOARD_STATISTICS,
  getDashboardStatisticsForUser,
} from '@/lib/dashboard/statistics';

interface DashboardStatsAsyncProps {
  userId: string;
}

async function _DashboardStatsAsync({ userId }: DashboardStatsAsyncProps) {
  const statistics = await getDashboardStatisticsForUser(userId);

  // Return statistics for use by parent component
  return statistics;
}

// Helper to get stats or return empty
export async function getStatsOrEmpty(userId: string | null) {
  if (!userId) return EMPTY_DASHBOARD_STATISTICS;
  return await getDashboardStatisticsForUser(userId);
}
