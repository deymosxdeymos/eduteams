import { describe, expect, it, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { MBTIDisplay } from '@/components/dashboard/mbti-display';

const baseUser: any = {
  id: 'u1',
  name: 'User',
  email: 'u@example.com',
  role: 'mahasiswa',
  isOnboarded: true,
  mbtiType: null,
  ei: 0,
  sn: 0,
  tf: 0,
  pj: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('MBTIDisplay', () => {
  it('renders placeholder when no MBTI type', () => {
    const user = { ...baseUser, mbtiType: null };
    // silence internal debug log
    const log = console.log;
    console.log = mock(() => {});

    render(<MBTIDisplay user={user} />);

    expect(screen.getByText('Take Test')).toBeTruthy();
    expect(
      screen.getByText(
        'Complete your personality test to discover your MBTI type'
      )
    ).toBeTruthy();

    console.log = log;
  });

  it('renders MBTI images when type present', () => {
    const user = { ...baseUser, mbtiType: 'ENFP' };
    const log = console.log;
    console.log = mock(() => {});

    render(<MBTIDisplay user={user} />);

    const imgs = screen.getAllByAltText('ENFP');
    expect(imgs.length).toBe(2);
    // One should be the text image, one the type image
    const srcs = imgs.map(img => (img as HTMLImageElement).getAttribute('src'));
    expect(srcs).toContain('/mbti-text/ENFP.svg');
    expect(srcs).toContain('/mbti-type/ENFP.svg');

    // Snapshot removed to avoid interactive updates in CI

    console.log = log;
  });
});
