import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import useSWR from 'swr';
import { messages as idMessages } from '@/i18n/dictionaries/id';
import { StatisticsCards } from '../statistics-cards';

// Mock SWR
mock.module('swr', () => ({
  default: mock(() => ({
    data: null,
    error: null,
  })),
}));

// Mock i18n dictionary loader to avoid dynamic import timing
mock.module('@/i18n/get-dictionary', () => ({
  getDictionary: async () => idMessages,
}));

const mockUseSWR = useSWR as any;

describe('StatisticsCards', () => {
  it('displays loading state with zeros when no data', async () => {
    mockUseSWR.mockReturnValue({
      data: null,
      error: null,
    });

    render(<StatisticsCards />);

    // Wait for i18n messages to load
    await screen.findByText('Total tugas telah dibuat');

    // Assert numbers and labels
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings.map(h => h.textContent)).toEqual(['0', '0', '0']);
    expect(screen.getByText('Total tugas telah dibuat')).toBeTruthy();
    expect(screen.getByText('Total kelompok berhasil dibentuk')).toBeTruthy();
    expect(screen.getByText('Rata-rata skor kualitas kelompok')).toBeTruthy();
  });

  it('displays statistics data when loaded', async () => {
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

    await screen.findByText('Total tugas telah dibuat');

    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('4.75')).toBeTruthy();
  });

  it('rounds average team quality to 2 decimal places', async () => {
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

    await screen.findByText('Rata-rata skor kualitas kelompok');

    expect(screen.getByText('4.12')).toBeTruthy();
  });

  it('handles error state gracefully', async () => {
    mockUseSWR.mockReturnValue({
      data: null,
      error: new Error('Failed to fetch statistics'),
    });

    render(<StatisticsCards />);
    await waitFor(() => {
      const hs = screen.getAllByRole('heading', { level: 1 });
      expect(hs.length).toBe(3);
    });

    // Should still display zeros when there's an error
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings.map(h => h.textContent)).toEqual(['0', '0', '0']);
  });

  it('fetches data from correct API endpoint', () => {
    render(<StatisticsCards />);

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/dashboard/statistics',
      expect.any(Function)
    );
  });
});
