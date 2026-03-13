import type { DashboardStatistics } from "@/lib/dashboard/statistics-types";

export interface DemoDashboardStatisticsState {
  createdAssignments?: ReadonlyArray<unknown>;
  formedTeams?: Record<
    string,
    {
      teams: ReadonlyArray<{
        quality?: number | null;
      }>;
    }
  >;
}

export function calculateDemoDashboardStatistics(
  state?: DemoDashboardStatisticsState,
): DashboardStatistics {
  const totalAssignments = 1 + (state?.createdAssignments?.length ?? 0);
  let totalTeams = 0;
  let qualityCount = 0;
  let qualitySum = 0;
  let minQuality: number | null = null;
  let maxQuality: number | null = null;

  for (const formation of Object.values(state?.formedTeams ?? {})) {
    totalTeams += formation.teams.length;

    for (const team of formation.teams) {
      if (typeof team.quality !== "number" || Number.isNaN(team.quality)) {
        continue;
      }

      qualityCount += 1;
      qualitySum += team.quality;
      minQuality = minQuality === null ? team.quality : Math.min(minQuality, team.quality);
      maxQuality = maxQuality === null ? team.quality : Math.max(maxQuality, team.quality);
    }
  }

  const meanQuality = qualityCount > 0 ? qualitySum / qualityCount : null;

  return {
    totalAssignments,
    totalTeams,
    avgTeamQuality: meanQuality ?? 0,
    qualitySummary: {
      min: minQuality,
      max: maxQuality,
      mean: meanQuality,
      n: qualityCount,
    },
  };
}
