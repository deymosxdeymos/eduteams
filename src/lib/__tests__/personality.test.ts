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

  it('keeps introversion-leaning responses on the I side of the EI axis', () => {
    const questions = [
      { id: 'q1', dimension: 'ei', reversed: false, isAttentionCheck: false },
      { id: 'q2', dimension: 'i', reversed: false, isAttentionCheck: false },
      { id: 'q3', dimension: 'sn', reversed: false, isAttentionCheck: false },
      { id: 'q4', dimension: 'tf', reversed: false, isAttentionCheck: false },
      { id: 'q5', dimension: 'pj', reversed: false, isAttentionCheck: false },
    ];

    const answers = {
      q1: 1, // strongly disagree with an extraversion prompt
      q2: 5, // strongly agree with an introversion prompt
      q3: 1,
      q4: 1,
      q5: 1,
    };

    const scores = calculatePersonalityScores(answers, questions);
    expect(scores.ei).toBeLessThan(0);
    expect(getMBTIType(scores)).toBe('ISTJ');
  });

  it('keeps intuiting-leaning S items on the N side of the SN axis when reversed', () => {
    const questions = [
      { id: 'ei', dimension: 'ei', reversed: false, isAttentionCheck: false },
      { id: 'sn', dimension: 'sn', reversed: false, isAttentionCheck: false },
      {
        id: 's-reversed',
        dimension: 's',
        reversed: true,
        isAttentionCheck: false,
      },
      { id: 'tf', dimension: 'tf', reversed: false, isAttentionCheck: false },
      { id: 'pj', dimension: 'pj', reversed: false, isAttentionCheck: false },
    ];
    const answers = {
      ei: 1,
      sn: 2,
      's-reversed': 5,
      tf: 1,
      pj: 1,
    };

    const scores = calculatePersonalityScores(answers, questions);
    expect(scores.sn).toBeGreaterThan(0);
    expect(getMBTIType(scores)).toBe('INTJ');
  });

  it('keeps thinking-leaning F items on the T side of the TF axis when reversed', () => {
    const questions = [
      { id: 'ei', dimension: 'ei', reversed: false, isAttentionCheck: false },
      { id: 'sn', dimension: 'sn', reversed: false, isAttentionCheck: false },
      { id: 'tf', dimension: 'tf', reversed: false, isAttentionCheck: false },
      {
        id: 'f-reversed',
        dimension: 'f',
        reversed: true,
        isAttentionCheck: false,
      },
      { id: 'pj', dimension: 'pj', reversed: false, isAttentionCheck: false },
    ];
    const answers = {
      ei: 1,
      sn: 1,
      tf: 4,
      'f-reversed': 5,
      pj: 1,
    };

    const scores = calculatePersonalityScores(answers, questions);
    expect(scores.tf).toBeLessThan(0);
    expect(getMBTIType(scores)).toBe('ISTJ');
  });

  it('keeps perceiving-leaning J items on the P side of the PJ axis when reversed', () => {
    const questions = [
      { id: 'ei', dimension: 'ei', reversed: false, isAttentionCheck: false },
      { id: 'sn', dimension: 'sn', reversed: false, isAttentionCheck: false },
      { id: 'tf', dimension: 'tf', reversed: false, isAttentionCheck: false },
      { id: 'pj', dimension: 'pj', reversed: false, isAttentionCheck: false },
      {
        id: 'j-reversed',
        dimension: 'j',
        reversed: true,
        isAttentionCheck: false,
      },
    ];
    const answers = {
      ei: 1,
      sn: 1,
      tf: 1,
      pj: 2,
      'j-reversed': 5,
    };

    const scores = calculatePersonalityScores(answers, questions);
    expect(scores.pj).toBeGreaterThan(0);
    expect(getMBTIType(scores)).toBe('ISTP');
  });
});
