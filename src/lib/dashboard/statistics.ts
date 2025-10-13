import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

export const DASHBOARD_STATISTICS_TAG = 'dashboard:statistics';

export interface DashboardStatistics {
  totalAssignments: number;
  totalTeams: number;
  avgTeamQuality: number;
  qualitySummary: {
    min: number | null;
    max: number | null;
    mean: number | null;
    n: number;
  };
}

export const EMPTY_DASHBOARD_STATISTICS: DashboardStatistics = {
  totalAssignments: 0,
  totalTeams: 0,
  avgTeamQuality: 0,
  qualitySummary: {
    min: null,
    max: null,
    mean: null,
    n: 0,
  },
};

async function fetchDashboardStatistics(
  userId: string
): Promise<DashboardStatistics> {
  const [totalAssignments, totalTeams, qualityAggregates] = await Promise.all([
    prisma.assignment.count({
      where: {
        createdById: userId,
      },
    }),
    prisma.team.count({
      where: {
        teamFormationRequest: {
          ownerId: userId,
        },
      },
    }),
    prisma.team.aggregate({
      where: {
        teamFormationRequest: {
          ownerId: userId,
        },
        quality: {
          not: null,
        },
      },
      _avg: {
        quality: true,
      },
      _min: {
        quality: true,
      },
      _max: {
        quality: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const qualityCount = qualityAggregates._count?._all ?? 0;

  return {
    totalAssignments,
    totalTeams,
    avgTeamQuality: qualityAggregates._avg.quality ?? 0,
    qualitySummary: {
      min: qualityAggregates._min.quality ?? null,
      max: qualityAggregates._max.quality ?? null,
      mean: qualityAggregates._avg.quality ?? null,
      n: qualityCount,
    },
  };
}

const getDashboardStatisticsCached = unstable_cache(
  fetchDashboardStatistics,
  ['dashboard:statistics'],
  {
    tags: [DASHBOARD_STATISTICS_TAG],
  }
);

export async function getDashboardStatisticsForUser(
  userId: string
): Promise<DashboardStatistics> {
  return getDashboardStatisticsCached(userId);
}
