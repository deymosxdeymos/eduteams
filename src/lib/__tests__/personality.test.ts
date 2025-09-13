import { describe, expect, it } from 'bun:test';
import {
  calculatePersonalityScores,
  getMBTIType,
  isValidAnswerRecord,
  isValidPersonalityScores,
} from '@/lib/personality';

describe('personality scoring', () => {
  it('computes max-positive scores and maps to ENFP', () => {
    const answers: Record<string, number> = {};
    // Non-reversed questions -> answer 5; reversed -> answer 1
    const reversed = new Set([4, 9, 11, 14, 15, 17, 20, 22, 23]);
    for (let i = 1; i <= 24; i++) {
      answers[i.toString()] = reversed.has(i) ? 1 : 5;
    }

    const scores = calculatePersonalityScores(answers);
    expect(scores.ei).toBe(1);
    expect(scores.sn).toBe(1);
    expect(scores.tf).toBe(1);
    expect(scores.pj).toBe(1);
    expect(getMBTIType(scores)).toBe('ENFP');
  });

  it('validates answer records and scores structure', () => {
    expect(isValidAnswerRecord({})).toBe(true);
    expect(isValidAnswerRecord({ '1': 3, '2': 5 })).toBe(true);
    // invalid: non-integer value
    expect(isValidAnswerRecord({ '1': 2.5 } as any)).toBe(false);
    // invalid: wrong types
    expect(isValidAnswerRecord('nope' as any)).toBe(false);

    expect(
      isValidPersonalityScores({ ei: 0, sn: 0.5, tf: -1, pj: 1 })
    ).toBe(true);
    expect(
      isValidPersonalityScores({ ei: 2, sn: 0, tf: 0, pj: 0 } as any)
    ).toBe(false);
  });
});

