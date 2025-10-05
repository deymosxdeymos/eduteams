import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'bun:test';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toBeTruthy();
    expect(input.getAttribute('data-slot')).toBe('input');
    expect(input.getAttribute('type')).toBe('text'); // default type
  });

  it('renders with custom type', () => {
    render(<Input type="email" />);

    const input = screen.getByRole('textbox');
    expect(input.getAttribute('type')).toBe('email');
  });

  it('renders with custom className', () => {
    render(<Input className="custom-class" />);

    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-class');
    expect(input.className).toContain('border-input'); // should include default classes
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeTruthy();
  });

  it('renders with value', () => {
    render(<Input value="test value" onChange={() => {}} />);

    const input = screen.getByDisplayValue('test value');
    expect(input).toBeTruthy();
  });

  it('renders with aria-invalid styling when aria-invalid is true', () => {
    render(<Input aria-invalid />);

    const input = screen.getByRole('textbox');
    expect(input.className).toContain('aria-invalid:ring-destructive/20');
    expect(input.className).toContain('aria-invalid:border-destructive');
  });

  it('applies focus styles', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input.className).toContain('focus-visible:border-ring');
    expect(input.className).toContain('focus-visible:ring-ring/50');
    expect(input.className).toContain('focus-visible:ring-[3px]');
  });

  it('applies disabled styles', () => {
    render(<Input disabled />);

    const input = screen.getByRole('textbox');
    expect(input.className).toContain('disabled:pointer-events-none');
    expect(input.className).toContain('disabled:cursor-not-allowed');
    expect(input.className).toContain('disabled:opacity-50');
  });

  it('forwards other props', () => {
    render(<Input data-testid="custom-input" name="test-input" />);

    const input = screen.getByTestId('custom-input');
    expect(input.getAttribute('name')).toBe('test-input');
  });
});
