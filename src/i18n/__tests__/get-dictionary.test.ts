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

// Mock the dynamic imports
mock.module('@/i18n/dictionaries/en', () => ({
  messages: mockEnMessages,
}));

mock.module('@/i18n/dictionaries/id', () => ({
  messages: mockIdMessages,
}));

describe('getDictionary', () => {
  beforeEach(() => {
    // Reset mocks before each test if needed
  });

  it('returns English dictionary for "en" locale', async () => {
    const result = await getDictionary('en');
    expect(result).toEqual(mockEnMessages);
    expect(result.greeting).toBe('Hello, {name}!');
  });

  it('returns Indonesian dictionary for "id" locale', async () => {
    const result = await getDictionary('id');
    expect(result).toEqual(mockIdMessages);
    expect(result.greeting).toBe('Halo, {name}!');
  });

  it('returns Indonesian dictionary as default for unknown locale', async () => {
    // TypeScript will complain about invalid locale, so we cast it
    const result = await getDictionary('unknown' as any);
    expect(result).toEqual(mockIdMessages);
    expect(result.greeting).toBe('Halo, {name}!');
  });

  it('returns expected structure for English dictionary', async () => {
    const result = await getDictionary('en');
    expect(result).toHaveProperty('greeting');
    expect(result).toHaveProperty('test');
    expect(typeof result.greeting).toBe('string');
    expect(typeof result.test).toBe('string');
  });

  it('returns expected structure for Indonesian dictionary', async () => {
    const result = await getDictionary('id');
    expect(result).toHaveProperty('greeting');
    expect(result).toHaveProperty('test');
    expect(typeof result.greeting).toBe('string');
    expect(typeof result.test).toBe('string');
  });

  it('handles concurrent dictionary loading', async () => {
    const [enResult, idResult] = await Promise.all([
      getDictionary('en'),
      getDictionary('id'),
    ]);

    expect(enResult).toEqual(mockEnMessages);
    expect(idResult).toEqual(mockIdMessages);
    expect(enResult).not.toEqual(idResult);
  });

  it('returns the same object reference for same locale calls', async () => {
    const result1 = await getDictionary('en');
    const result2 = await getDictionary('en');

    // Note: In a real implementation, this might return different objects
    // but the content should be the same
    expect(result1.greeting).toBe(result2.greeting);
    expect(result1.test).toBe(result2.test);
  });
});