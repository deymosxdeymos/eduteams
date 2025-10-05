import { describe, expect, it } from 'bun:test';
import {
  MBTITypeSchema,
  PersonalityScoresSchema,
  UserPersonalityUpdateSchema,
} from '@/lib/validation/personality';

describe('validation/personality', () => {
  it('validates personality scores in range', () => {
    const value = { ei: 1, sn: 0, tf: -0.5, pj: 1 };
    expect(PersonalityScoresSchema.parse(value)).toEqual(value);
  });

  it('rejects partial score updates and mbti without all scores', () => {
    // Partial scores should fail
    expect(() => UserPersonalityUpdateSchema.parse({ ei: 0.1 })).toThrow();
    // MBTI without full scores should fail
    expect(() => UserPersonalityUpdateSchema.parse({ mbtiType: 'ENFP' })).toThrow();
    // Full scores with MBTI should pass
    const ok = UserPersonalityUpdateSchema.parse({
      ei: 0.2,
      sn: -0.1,
      tf: 0,
      pj: 0.9,
      mbtiType: MBTITypeSchema.parse('ENFP'),
    });
    expect(ok).toBeTruthy();
  });
});

