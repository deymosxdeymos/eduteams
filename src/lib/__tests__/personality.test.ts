import { describe, expect, it } from 'bun:test';
import {
  calculatePersonalityScores,
  getMBTIType,
  isValidAnswerRecord,
  isValidPersonalityScores,
} from '@/lib/personality';

describe('personality scoring', () => {
  it('computes max-positive scores and maps to ENFP', () => {
    const questions = [
      { id: 'q1', dimension: 'ei', reversed: false, isAttentionCheck: false },
      { id: 'q2', dimension: 'ei', reversed: true, isAttentionCheck: false },
      { id: 'q3', dimension: 'sn', reversed: false, isAttentionCheck: false },
      { id: 'q4', dimension: 'sn', reversed: true, isAttentionCheck: false },
      { id: 'q5', dimension: 'tf', reversed: false, isAttentionCheck: false },
      { id: 'q6', dimension: 'tf', reversed: true, isAttentionCheck: false },
      { id: 'q7', dimension: 'pj', reversed: false, isAttentionCheck: false },
      { id: 'q8', dimension: 'pj', reversed: true, isAttentionCheck: false },
      { id: 'q9', dimension: 'ei', reversed: false, isAttentionCheck: true }, // attention check ignored
    ];
    const answers = {
      q1: 5,
      q2: 1,
      q3: 5,
      q4: 1,
      q5: 5,
      q6: 1,
      q7: 5,
      q8: 1,
      q9: 4,
    };

    const scores = calculatePersonalityScores(answers, questions);
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

    expect(isValidPersonalityScores({ ei: 0, sn: 0.5, tf: -1, pj: 1 })).toBe(
      true
    );
    expect(
      isValidPersonalityScores({ ei: 2, sn: 0, tf: 0, pj: 0 } as any)
    ).toBe(false);

    expect(() =>
      calculatePersonalityScores({ '1': 6 }, [
        {
          id: '1',
          dimension: 'ei',
          reversed: false,
          isAttentionCheck: false,
        },
      ])
    ).toThrowError();
  });
});
