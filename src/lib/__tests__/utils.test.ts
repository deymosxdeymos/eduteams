import { describe, expect, it } from 'bun:test';
import { cn } from '@/lib/utils';

describe('utils.cn', () => {
  it('merges class names and drops falsy', () => {
    const result = cn('a', undefined as unknown as string, null as unknown as string, false as unknown as string, 'b');
    expect(result).toBe('a b');
  });

  it('resolves Tailwind conflicts', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });
});

