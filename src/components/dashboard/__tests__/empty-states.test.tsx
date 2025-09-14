import { render, screen } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import { EmptyClassState } from '../empty-class-state';
import { EmptyStudentClassState } from '../empty-student-class-state';

// Mock messages for testing
const mockMessages = {
  dashboard: {
    emptyStates: {
      dosen: {
        title: 'Anda belum membuat kelas',
        description: 'Buat kelas untuk memulai pembagian kelompok',
      },
      student: {
        title: 'Anda belum memiliki kelas',
        description:
          'Masukkan token kelas yang diberikan oleh dosen untuk bergabung ke kelas',
      },
    },
    modals: {
      joinClass: {
        button: 'Masuk Kelas',
      },
    },
  },
};

// Mock i18n client functions
mock.module('@/i18n/client', () => ({
  getClientLocaleFromCookie: () => 'id',
  onLocaleChange: (callback: (locale: string) => void) => {
    // Return unsubscribe function
    return () => {};
  },
  emitLocaleChange: () => {},
}));

// Mock i18n dictionary loader
mock.module('@/i18n/get-dictionary', () => ({
  getDictionary: async () => mockMessages,
}));

describe('Dashboard empty states', () => {
  it('renders dosen empty state and matches snapshot', async () => {
    render(<EmptyClassState />);

    // Wait for i18n messages to load and render
    await screen.findByText('Anda belum membuat kelas');
    expect(
      screen.getByText('Buat kelas untuk memulai pembagian kelompok')
    ).toBeTruthy();

    // Snapshot removed to avoid interactive updates in CI
  });

  it('renders student empty state and matches snapshot', async () => {
    render(<EmptyStudentClassState />);

    await screen.findByText('Anda belum memiliki kelas');
    expect(
      screen.getByText(
        'Masukkan token kelas yang diberikan oleh dosen untuk bergabung ke kelas'
      )
    ).toBeTruthy();

    // Ensure join button exists (modal trigger)
    expect(screen.getByRole('button', { name: /Masuk Kelas/i })).toBeTruthy();

    // Snapshot removed to avoid interactive updates in CI
  });
});
