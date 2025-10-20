import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import JoinClassModal from '@/components/dashboard/join-class-modal';

describe('JoinClassModal', () => {
  it('submits successfully and shows success message', async () => {
    const fetchMock = mock(async (_input: RequestInfo, _init?: RequestInit) => {
      return new Response(
        JSON.stringify({ message: 'Successfully joined class!' }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }) as any;
    (globalThis as any).fetch = fetchMock;

    render(<JoinClassModal onClassJoined={mock(() => {})} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /dashboard\.modals\.joinClass\.button/i,
      })
    );

    const input = await screen.findByPlaceholderText(
      'dashboard.modals.joinClass.classCodePlaceholder'
    );
    fireEvent.change(input, { target: { value: 'abc123' } });
    fireEvent.click(
      screen.getByRole('button', {
        name: /dashboard\.modals\.joinClass\.join/i,
      })
    );

    await screen.findByText('Successfully joined class!');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/student/join-class',
      expect.any(Object)
    );
  });

  it('shows error message on invalid token (404)', async () => {
    const fetchMock = mock(async (_input: RequestInfo, _init?: RequestInit) => {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }) as any;
    (globalThis as any).fetch = fetchMock;

    render(<JoinClassModal />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /dashboard\.modals\.joinClass\.button/i,
      })
    );

    const input = await screen.findByPlaceholderText(
      'dashboard.modals.joinClass.classCodePlaceholder'
    );
    fireEvent.change(input, { target: { value: 'badcode' } });
    fireEvent.click(
      screen.getByRole('button', {
        name: /dashboard\.modals\.joinClass\.join/i,
      })
    );

    await screen.findByText('dashboard.modals.joinClass.invalidCode');
    const invalidInput = screen.getByPlaceholderText(
      'dashboard.modals.joinClass.classCodePlaceholder'
    );
    expect(invalidInput.getAttribute('aria-invalid')).toBe('true');
  });
});
