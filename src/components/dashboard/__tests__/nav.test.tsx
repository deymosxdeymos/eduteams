import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'bun:test';
import Nav from '@/components/dashboard/nav';

const baseUser: any = {
  id: 'u1',
  name: 'Dosen',
  email: 'd@example.com',
  role: 'dosen',
  isOnboarded: true,
};

describe('Nav', () => {
  it('renders breadcrumb for class and assignment, highlights current crumb', async () => {
    const classObj: any = {
      id: 'c1',
      namaMataKuliah: 'Algoritma',
      kelas: 'RA',
    };

    render(
      <Nav
        user={baseUser}
        className={classObj}
        assignmentTitle='Tugas 1'
        answersCrumb='Jawaban'
      />
    );

    // Wait for i18n messages to load
    const classHeading = await screen.findByRole('heading', {
      level: 1,
      name: 'Algoritma - RA',
    });
    expect(classHeading).toBeTruthy();

    // Assignment crumb appears
    const assignmentHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Tugas 1',
    });
    expect(assignmentHeading).toBeTruthy();

    // Answers crumb appears with provided label
    const answersHeading = screen.getByRole('heading', {
      level: 3,
      name: 'Jawaban',
    });
    expect(answersHeading).toBeTruthy();
  });
});
