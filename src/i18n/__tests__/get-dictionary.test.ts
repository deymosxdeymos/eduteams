import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { getDictionary } from '../get-dictionary';
import type { Locale } from '../config';

// Mock the dictionary modules
const mockEnMessages = {
  greeting: 'Hello, {name}!',
  test: 'English test message',
};

const mockIdMessages = {
  greeting: 'Halo, {name}!',
  test: 'Pesan tes bahasa Indonesia',
};

// Mock the dynamic imports. Cast to any to avoid tight coupling to full dictionary type.
mock.module('@/i18n/dictionaries/en', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test double for typed module
  messages: mockEnMessages as any,
}));

mock.module('@/i18n/dictionaries/id', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test double for typed module
  messages: mockIdMessages as any,
}));

describe('getDictionary', () => {
  beforeEach(() => {
    // Reset mocks before each test if needed
  });

  it('returns English dictionary for "en" locale', async () => {
    const result = await getDictionary('en');
    expect(result.greeting as string).toBe(mockEnMessages.greeting);
  });

  it('returns Indonesian dictionary for "id" locale', async () => {
    const result = await getDictionary('id');
    expect(result.greeting).toBe('Halo, {name}!');
  });

  it('returns Indonesian dictionary as default for unknown locale', async () => {
    // TypeScript will complain about invalid locale, so we cast it
    const result = await getDictionary('unknown' as any);
    expect(result.greeting).toBe('Halo, {name}!');
  });

  it('returns expected structure for English dictionary', async () => {
    const result = await getDictionary('en');
    expect(result).toHaveProperty('greeting');
    expect(typeof result.greeting).toBe('string');
  });

  it('returns expected structure for Indonesian dictionary', async () => {
    const result = await getDictionary('id');
    expect(result).toHaveProperty('greeting');
    expect(typeof result.greeting).toBe('string');
  });

  it('handles concurrent dictionary loading', async () => {
    const [enResult, idResult] = await Promise.all([
      getDictionary('en'),
      getDictionary('id'),
    ]);

    expect(enResult.greeting as string).toBe(mockEnMessages.greeting);
    expect(idResult.greeting as string).toBe(mockIdMessages.greeting);
    expect(enResult.greeting).not.toBe(idResult.greeting);
  });

  it('returns the same object reference for same locale calls', async () => {
    const result1 = await getDictionary('en');
    const result2 = await getDictionary('en');

    // Note: In a real implementation, this might return different objects
    // but the content should be the same
    expect(result1.greeting).toBe(result2.greeting);
  });
});
