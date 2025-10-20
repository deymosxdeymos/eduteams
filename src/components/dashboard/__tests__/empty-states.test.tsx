import { describe, expect, it } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { EmptyClassState } from '../empty-class-state';
import { EmptyStudentClassState } from '../empty-student-class-state';

describe('Dashboard empty states', () => {
  it('renders dosen empty state and matches snapshot', () => {
    render(<EmptyClassState />);

    expect(screen.getByText('dashboard.emptyStates.dosen.title')).toBeTruthy();
    expect(
      screen.getByText('dashboard.emptyStates.dosen.description')
    ).toBeTruthy();
  });

  it('renders student empty state and matches snapshot', () => {
    render(<EmptyStudentClassState />);

    expect(
      screen.getByText('dashboard.emptyStates.student.title')
    ).toBeTruthy();
    expect(
      screen.getByText('dashboard.emptyStates.student.description')
    ).toBeTruthy();

    expect(
      screen.getByRole('button', {
        name: /dashboard\.modals\.joinClass\.button/i,
      })
    ).toBeTruthy();
  });
});
