import { render, screen } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import useSWR from 'swr';
import { StatisticsCards } from '../statistics-cards';

// Mock SWR
mock.module('swr', () => ({
  default: mock(() => ({
    data: null,
    error: null,
  })),
}));

const mockUseSWR = useSWR as any;

describe('StatisticsCards', () => {
  it('displays loading state with zeros when no data', () => {
    mockUseSWR.mockReturnValue({
      data: null,
      error: null,
    });

    render(<StatisticsCards />);

    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('Total tugas telah dibuat')).toBeTruthy();
    expect(screen.getByText('Total kelompok berhasil dibentuk')).toBeTruthy();
    expect(screen.getByText('Rata-rata skor kualitas kelompok')).toBeTruthy();
  });

  it('displays statistics data when loaded', () => {
    const mockData = {
      data: {
        totalAssignments: 5,
        totalTeams: 12,
        avgTeamQuality: 4.75,
      },
    };

    mockUseSWR.mockReturnValue({
      data: mockData,
      error: null,
    });

    render(<StatisticsCards />);

    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('4.75')).toBeTruthy();
  });

  it('rounds average team quality to 2 decimal places', () => {
    const mockData = {
      data: {
        totalAssignments: 3,
        totalTeams: 8,
        avgTeamQuality: 4.123456,
      },
    };

    mockUseSWR.mockReturnValue({
      data: mockData,
      error: null,
    });

    render(<StatisticsCards />);

    expect(screen.getByText('4.12')).toBeTruthy();
  });

  it('handles error state gracefully', () => {
    const consoleSpy = mock(() => {});
    const originalError = console.error;
    console.error = consoleSpy;

    mockUseSWR.mockReturnValue({
      data: null,
      error: new Error('Failed to fetch statistics'),
    });

    render(<StatisticsCards />);

    // Should still display zeros when there's an error
    expect(screen.getByText('0')).toBeTruthy();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load statistics:',
      expect.any(Error)
    );

    console.error = originalError;
  });

  it('fetches data from correct API endpoint', () => {
    render(<StatisticsCards />);

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/dashboard/statistics',
      expect.any(Function)
    );
  });
});
