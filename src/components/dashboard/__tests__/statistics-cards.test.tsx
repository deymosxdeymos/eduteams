import { describe, expect, it } from 'bun:test';
import { render, screen } from '@testing-library/react';
import {
  type DashboardStatistics,
  EMPTY_DASHBOARD_STATISTICS,
} from '@/lib/dashboard/statistics';
import { StatisticsCards } from '../statistics-cards';

describe('StatisticsCards', () => {
  it('displays loading state with zeros and placeholders when no data', () => {
    render(<StatisticsCards />);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings.map(h => h.textContent)).toEqual([
      '0',
      '0',
      'N/A',
      'N/A',
      'N/A',
    ]);
    expect(screen.getByText('Total assignments created')).toBeTruthy();
    expect(screen.getByText('Total teams successfully formed')).toBeTruthy();
    expect(screen.getByText('Team Quality')).toBeTruthy();
  });

  it('displays statistics data when loaded', () => {
    const mockData: DashboardStatistics = {
      totalAssignments: 5,
      totalTeams: 12,
      avgTeamQuality: 0.5,
      qualitySummary: { min: 0.1, max: 0.9, mean: 0.5, n: 10 },
    };

    render(<StatisticsCards statistics={mockData} />);

    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('10%')).toBeTruthy();
    expect(screen.getByText('90%')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('rounds percent values correctly', () => {
    const mockData: DashboardStatistics = {
      totalAssignments: 3,
      totalTeams: 8,
      avgTeamQuality: 0.4119,
      qualitySummary: { min: 0.001, max: 0.999, mean: 0.4119, n: 10 },
    };

    render(<StatisticsCards statistics={mockData} />);
    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('41%')).toBeTruthy();
  });

  it('falls back to placeholders when no quality records exist', () => {
    const mockData: DashboardStatistics = {
      ...EMPTY_DASHBOARD_STATISTICS,
      totalAssignments: 7,
      totalTeams: 4,
    };

    render(<StatisticsCards statistics={mockData} />);

    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getAllByText('N/A')).toHaveLength(3);
  });
});
