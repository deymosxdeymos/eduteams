import { describe, expect, test } from 'bun:test';
import { getDictionary } from '@/i18n/get-dictionary';

describe('i18n dictionaries', () => {
  test('id dictionary returns Indonesian strings', async () => {
    const id = await getDictionary('id');
    expect(id.greeting.replace('{name}', 'Budi')).toContain('Halo');
    expect(id.answersDefault).toBe('Jawaban Mahasiswa');
  });

  test('en dictionary returns English strings', async () => {
    const en = await getDictionary('en');
    expect(en.greeting.replace('{name}', 'John')).toContain('Hello');
    expect(en.answersDefault).toBe('Student Answers');
  });
});


