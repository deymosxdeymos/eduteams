import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import { ClassCard } from '@/components/dashboard/class-card';

describe('ClassCard', () => {
  it('renders props and navigates on click', async () => {
    const push = mock(() => {});
    // Override next/navigation for this test to capture push
    mock.module('next/navigation', () => ({ useRouter: () => ({ push }) }));

    const classId = `class-${Math.random().toString(36).slice(2)}`;

    render(
      <ClassCard
        id={classId}
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
    expect(push).toHaveBeenCalledWith(`/dashboard/class/${classId}`);

    // Snapshot removed to avoid interactive updates in CI
  });

  it('supports keyboard activation (Enter)', () => {
    const push = mock(() => {});
    mock.module('next/navigation', () => ({ useRouter: () => ({ push }) }));

    const classId = `class-${Math.random().toString(36).slice(2)}`;

    render(
      <ClassCard
        id={classId}
        title='Algoritma'
        academicYear='2024/2025'
        studentCount={12}
        classCode='RA'
      />
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(push).toHaveBeenCalledWith(`/dashboard/class/${classId}`);
  });
});
