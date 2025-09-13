import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import { ClassCard } from '@/components/dashboard/class-card';

describe('ClassCard', () => {
  it('renders props and navigates on click', async () => {
    const push = mock(() => {});
    // Override next/navigation for this test to capture push
    mock.module('next/navigation', () => ({ useRouter: () => ({ push }) }));

    render(
      <ClassCard
        id='c123'
        title='Algoritma'
        academicYear='2024/2025'
        studentCount={12}
        classCode='RA'
      />
    );

    expect(screen.getByText('Algoritma')).toBeTruthy();
    expect(screen.getByText('2024/2025')).toBeTruthy();
    expect(screen.getByText(/12 mahasiswa/)).toBeTruthy();
    expect(screen.getByText('RA')).toBeTruthy();

    const card = screen.getByRole('button');
    fireEvent.click(card);
    expect(push).toHaveBeenCalledWith('/dashboard/class/c123');

    // Snapshot removed to avoid interactive updates in CI
  });

  it('supports keyboard activation (Enter)', () => {
    const push = mock(() => {});
    mock.module('next/navigation', () => ({ useRouter: () => ({ push }) }));

    render(
      <ClassCard
        id='c123'
        title='Algoritma'
        academicYear='2024/2025'
        studentCount={12}
        classCode='RA'
      />
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(push).toHaveBeenCalledWith('/dashboard/class/c123');
  });
});
