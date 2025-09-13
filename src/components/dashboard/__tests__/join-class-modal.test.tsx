import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import JoinClassModal from '@/components/dashboard/join-class-modal';

describe('JoinClassModal', () => {
  it('submits successfully and shows success message', async () => {
    // Mock fetch success
    const fetchMock = mock(async (_input: RequestInfo, _init?: RequestInit) => {
      return new Response(JSON.stringify({ message: 'Successfully joined class!' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as any;
    (globalThis as any).fetch = fetchMock;

    render(<JoinClassModal onClassJoined={mock(() => {})} />);

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /Masuk Kelas/i }));

    // Fill and submit
    const input = await screen.findByPlaceholderText('687ad8sa');
    fireEvent.change(input, { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk$/ }));

    await screen.findByText('Successfully joined class!');
    expect(fetchMock).toHaveBeenCalledWith('/api/student/join-class', expect.any(Object));
  });

  it('shows error message on invalid token (404)', async () => {
    const fetchMock = mock(async (_input: RequestInfo, _init?: RequestInit) => {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }) as any;
    ;(globalThis as any).fetch = fetchMock;

    render(<JoinClassModal />);

    fireEvent.click(screen.getByRole('button', { name: /Masuk Kelas/i }));

    const input = await screen.findByPlaceholderText('687ad8sa');
    fireEvent.change(input, { target: { value: 'badcode' } });
    fireEvent.click(screen.getByRole('button', { name: /Masuk$/ }));

    // Default Indonesian error string should appear
    await screen.findByText('Kode yang Anda masukkan salah. Silahkan coba lagi');
    // Input is remounted due to shake animation; re-query and expect invalid
    const invalidInput = screen.getByPlaceholderText('687ad8sa');
    expect(invalidInput.getAttribute('aria-invalid')).toBe('true');
  });
});
