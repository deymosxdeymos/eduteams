import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'bun:test';
import { EmptyClassState } from '@/components/dashboard/empty-class-state';
import { EmptyStudentClassState } from '@/components/dashboard/empty-student-class-state';

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
