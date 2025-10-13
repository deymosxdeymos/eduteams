import { describe, expect, it } from 'bun:test';
import { render } from '@testing-library/react';
import { LoadingPage, LoadingSpinner } from '@/components/ui/loading-spinner';

describe('LoadingSpinner', () => {
  it('renders 12 bars with default sizing and styling', () => {
    const { container } = render(<LoadingSpinner />);

    const wrapper = container.querySelector('div.inline-block') as HTMLElement;
    const bars = container.querySelectorAll('.spinner-bar');

    expect(wrapper).toBeTruthy();
    expect(wrapper.style.height).toBe('20px');
    expect(wrapper.style.width).toBe('20px');
    expect(bars.length).toBe(12);
    expect(bars[0]?.getAttribute('style')).toContain('background: white');
  });

  it('honors size variants for sm and lg', () => {
    const variants: Array<{ size: 'sm' | 'lg'; dimension: number }> = [
      { size: 'sm', dimension: 16 },
      { size: 'lg', dimension: 28 },
    ];

    for (const { size, dimension } of variants) {
      const { container, unmount } = render(<LoadingSpinner size={size} />);
      const wrapper = container.querySelector('div.inline-block') as HTMLElement;

      expect(wrapper.style.height).toBe(`${dimension}px`);
      expect(wrapper.style.width).toBe(`${dimension}px`);
      unmount();
    }
  });

  it('applies custom class names and colors', () => {
    const { container } = render(
      <LoadingSpinner className='text-gray-500' color='#333' />
    );

    const wrapper = container.querySelector('div.inline-block') as HTMLElement;
    const firstBar = container.querySelector('.spinner-bar');

    expect(wrapper.className).toContain('text-gray-500');
    expect(firstBar?.getAttribute('style')).toContain('background: #333');
  });
});

describe('LoadingPage', () => {
  it('renders a spinner with label', () => {
    const { container, getByText } = render(<LoadingPage />);

    expect(getByText('Loading...')).toBeInTheDocument();
    expect(container.querySelectorAll('.spinner-bar').length).toBe(12);
  });
});
