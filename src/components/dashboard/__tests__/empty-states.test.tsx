import { describe, expect, it } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import { EmptyClassState } from '../empty-class-state';
import { EmptyStudentClassState } from '../empty-student-class-state';

describe('Dashboard empty states', () => {
  it('renders dosen empty state and matches snapshot', () => {
    render(<EmptyClassState />);

    expect(
      screen.getByText("You haven't created any classes yet")
    ).toBeTruthy();
    expect(
      screen.getByText('Create a class to start team formation')
    ).toBeTruthy();
  });

  it('renders student empty state and matches snapshot', async () => {
    render(<EmptyStudentClassState />);

    expect(screen.getByText("You don't have any classes yet")).toBeTruthy();
    expect(
      screen.getByText(
        'Enter the class token provided by your lecturer to join a class'
      )
    ).toBeTruthy();

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /Join Class/i,
        })
      ).toBeTruthy();
    });
  });
});
