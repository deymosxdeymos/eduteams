import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import useSWR from 'swr';
import { StatisticsCards } from '../statistics-cards';

mock.module('swr', () => ({
  default: mock(() => ({
    data: null,
    error: null,
  })),
}));

const mockUseSWR = useSWR as any;

describe('StatisticsCards', () => {
  it('displays loading state with zeros and placeholders when no data', async () => {
    mockUseSWR.mockReturnValue({
      data: null,
      error: null,
    });

    render(<StatisticsCards />);

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings.map(h => h.textContent)).toEqual(['0', '0', '0%', '0%', '0%']);
    });

    expect(screen.getByText('dashboard.statistics.totalAssignments')).toBeTruthy();
    expect(screen.getByText('dashboard.statistics.totalTeams')).toBeTruthy();
    expect(screen.getByText('dashboard.statistics.qualityTitle')).toBeTruthy();
  });

  it('displays statistics data when loaded', async () => {
    const mockData = {
      data: {
        totalAssignments: 5,
        totalTeams: 12,
        avgTeamQuality: 0.5,
        qualitySummary: { min: 0.1, max: 0.9, mean: 0.5, n: 10 },
      },
    };

    mockUseSWR.mockReturnValue({
      data: mockData,
      error: null,
    });

    render(<StatisticsCards />);

    await screen.findByText('dashboard.statistics.totalAssignments');

    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('10%')).toBeTruthy();
    expect(screen.getByText('90%')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('rounds percent values correctly', async () => {
    const mockData = {
      data: {
        totalAssignments: 3,
        totalTeams: 8,
        avgTeamQuality: 0.4119,
        qualitySummary: { min: 0.001, max: 0.999, mean: 0.4119, n: 10 },
      },
    };

    mockUseSWR.mockReturnValue({
      data: mockData,
      error: null,
    });

    render(<StatisticsCards />);

    await screen.findByText('dashboard.statistics.qualityTitle');
    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('41%')).toBeTruthy();
  });

  it('handles error state gracefully', async () => {
    mockUseSWR.mockReturnValue({
      data: null,
      error: new Error('Failed to fetch statistics'),
    });

    render(<StatisticsCards />);
    await waitFor(() => {
      const hs = screen.getAllByRole('heading', { level: 1 });
      expect(hs.length).toBeGreaterThanOrEqual(2);
    });

    const totals = screen.getAllByRole('heading', { level: 1 }).slice(0, 2);
    expect(totals.map(h => h.textContent)).toEqual(['0', '0']);
  });

  it('fetches data from correct API endpoint', () => {
    render(<StatisticsCards />);

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/dashboard/statistics',
      expect.any(Function)
    );
  });
});
