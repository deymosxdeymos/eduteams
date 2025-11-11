import { describe, expect, it } from 'bun:test';
import { getMBTIType, generateScoresForMBTI } from './dev-data-generators';

type MBTIType = 'ENFP' | 'ENFJ' | 'ENTP' | 'ENTJ' | 'ESFP' | 'ESFJ' | 'ESTP' | 'ESTJ' | 'INFP' | 'INFJ' | 'INTP' | 'INTJ' | 'ISFP' | 'ISFJ' | 'ISTP' | 'ISTJ';

describe('getMBTIType', () => {
  it('correctly maps all positive scores to ENFP', () => {
    expect(getMBTIType({ ei: 0.5, sn: 0.5, tf: 0.5, pj: 0.5 })).toBe('ENFP');
  });

  it('correctly maps all negative scores to ISTJ', () => {
    expect(getMBTIType({ ei: -0.5, sn: -0.5, tf: -0.5, pj: -0.5 })).toBe('ISTJ');
  });

  it('correctly maps mixed scores for ENTP', () => {
    expect(getMBTIType({ ei: 0.5, sn: 0.5, tf: -0.5, pj: 0.5 })).toBe('ENTP');
  });

  it('correctly maps mixed scores for ISFJ', () => {
    expect(getMBTIType({ ei: -0.5, sn: -0.5, tf: 0.5, pj: -0.5 })).toBe('ISFJ');
  });

  it('correctly maps zero values as positive (ENFP)', () => {
    expect(getMBTIType({ ei: 0, sn: 0, tf: 0, pj: 0 })).toBe('ENFP');
  });

  it('correctly handles edge cases at boundaries', () => {
    expect(getMBTIType({ ei: 1, sn: 1, tf: 1, pj: 1 })).toBe('ENFP');
    expect(getMBTIType({ ei: -1, sn: -1, tf: -1, pj: -1 })).toBe('ISTJ');
  });

  it('correctly maps all 16 MBTI types', () => {
    const testCases: Array<{ scores: { ei: number; sn: number; tf: number; pj: number }; expected: MBTIType }> = [
      { scores: { ei: 0.5, sn: 0.5, tf: 0.5, pj: 0.5 }, expected: 'ENFP' },
      { scores: { ei: 0.5, sn: 0.5, tf: 0.5, pj: -0.5 }, expected: 'ENFJ' },
      { scores: { ei: 0.5, sn: 0.5, tf: -0.5, pj: 0.5 }, expected: 'ENTP' },
      { scores: { ei: 0.5, sn: 0.5, tf: -0.5, pj: -0.5 }, expected: 'ENTJ' },
      { scores: { ei: 0.5, sn: -0.5, tf: 0.5, pj: 0.5 }, expected: 'ESFP' },
      { scores: { ei: 0.5, sn: -0.5, tf: 0.5, pj: -0.5 }, expected: 'ESFJ' },
      { scores: { ei: 0.5, sn: -0.5, tf: -0.5, pj: 0.5 }, expected: 'ESTP' },
      { scores: { ei: 0.5, sn: -0.5, tf: -0.5, pj: -0.5 }, expected: 'ESTJ' },
      { scores: { ei: -0.5, sn: 0.5, tf: 0.5, pj: 0.5 }, expected: 'INFP' },
      { scores: { ei: -0.5, sn: 0.5, tf: 0.5, pj: -0.5 }, expected: 'INFJ' },
      { scores: { ei: -0.5, sn: 0.5, tf: -0.5, pj: 0.5 }, expected: 'INTP' },
      { scores: { ei: -0.5, sn: 0.5, tf: -0.5, pj: -0.5 }, expected: 'INTJ' },
      { scores: { ei: -0.5, sn: -0.5, tf: 0.5, pj: 0.5 }, expected: 'ISFP' },
      { scores: { ei: -0.5, sn: -0.5, tf: 0.5, pj: -0.5 }, expected: 'ISFJ' },
      { scores: { ei: -0.5, sn: -0.5, tf: -0.5, pj: 0.5 }, expected: 'ISTP' },
      { scores: { ei: -0.5, sn: -0.5, tf: -0.5, pj: -0.5 }, expected: 'ISTJ' },
    ];

    for (const { scores, expected } of testCases) {
      expect(getMBTIType(scores)).toBe(expected);
    }
  });
});

describe('generateScoresForMBTI', () => {
  it('generates scores that match the MBTI type ENTP', () => {
    const scores = generateScoresForMBTI('ENTP');
    expect(getMBTIType(scores)).toBe('ENTP');
  });

  it('generates scores that match the MBTI type ISFJ', () => {
    const scores = generateScoresForMBTI('ISFJ');
    expect(getMBTIType(scores)).toBe('ISFJ');
  });

  it('generates consistent scores for all 16 MBTI types', () => {
    const allTypes: MBTIType[] = [
      'ENFP', 'ENFJ', 'ENTP', 'ENTJ',
      'ESFP', 'ESFJ', 'ESTP', 'ESTJ',
      'INFP', 'INFJ', 'INTP', 'INTJ',
      'ISFP', 'ISFJ', 'ISTP', 'ISTJ',
    ];

    for (const type of allTypes) {
      const scores = generateScoresForMBTI(type);
      expect(getMBTIType(scores)).toBe(type);
    }
  });

  it('generates scores with appropriate variance (0.3 to 1.0)', () => {
    const scores = generateScoresForMBTI('ENFP');
    
    // All should be positive for ENFP
    expect(scores.ei).toBeGreaterThan(0);
    expect(scores.sn).toBeGreaterThan(0);
    expect(scores.tf).toBeGreaterThan(0);
    expect(scores.pj).toBeGreaterThan(0);
    
    // All should be within expected range
    expect(scores.ei).toBeGreaterThanOrEqual(0.3);
    expect(scores.ei).toBeLessThanOrEqual(1.0);
    expect(scores.sn).toBeGreaterThanOrEqual(0.3);
    expect(scores.sn).toBeLessThanOrEqual(1.0);
  });

  it('generates scores with correct signs for ISTJ', () => {
    const scores = generateScoresForMBTI('ISTJ');
    
    // All should be negative for ISTJ
    expect(scores.ei).toBeLessThan(0);
    expect(scores.sn).toBeLessThan(0);
    expect(scores.tf).toBeLessThan(0);
    expect(scores.pj).toBeLessThan(0);
    
    // All should be within expected range
    expect(scores.ei).toBeGreaterThanOrEqual(-1.0);
    expect(scores.ei).toBeLessThanOrEqual(-0.3);
  });
});
