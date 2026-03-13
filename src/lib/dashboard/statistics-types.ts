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

export const DASHBOARD_STATISTICS_TAG = "dashboard:statistics";
