import { describe, expect, it } from 'bun:test';
import type { ExtendedUser } from '@/lib/types';
import {
  DIMENSION_CONFIG,
  RADAR_AXIS_ORDER,
  buildRadarData,
  computeAllDimensionMetrics,
  computeDimensionMetrics,
  getDimensionScore,
} from '@/lib/utils/mbti-dimension';

describe('computeDimensionMetrics', () => {
  it('returns balanced metrics for null score', () => {
    const result = computeDimensionMetrics(null);
    expect(result).toEqual({
      percentage: 50,
      isRightAligned: false,
      leftPercentage: 50,
      rightPercentage: 50,
      dominantSide: 'balanced',
      dominantPercentage: 50,
    });
  });

  it('returns balanced metrics for undefined score', () => {
    const result = computeDimensionMetrics(undefined);
    expect(result).toEqual({
      percentage: 50,
      isRightAligned: false,
      leftPercentage: 50,
      rightPercentage: 50,
      dominantSide: 'balanced',
      dominantPercentage: 50,
    });
  });

  it('returns balanced metrics for NaN score', () => {
    const result = computeDimensionMetrics(Number.NaN);
    expect(result).toEqual({
      percentage: 50,
      isRightAligned: false,
      leftPercentage: 50,
      rightPercentage: 50,
      dominantSide: 'balanced',
      dominantPercentage: 50,
    });
  });

  it('computes metrics for maximum negative score (-1)', () => {
    const result = computeDimensionMetrics(-1);
    expect(result.leftPercentage).toBe(100);
    expect(result.rightPercentage).toBe(0);
    expect(result.isRightAligned).toBe(false);
    expect(result.dominantSide).toBe('left');
    expect(result.percentage).toBe(100);
  });

  it('computes metrics for maximum positive score (1)', () => {
    const result = computeDimensionMetrics(1);
    expect(result.leftPercentage).toBe(0);
    expect(result.rightPercentage).toBe(100);
    expect(result.isRightAligned).toBe(true);
    expect(result.dominantSide).toBe('right');
    expect(result.percentage).toBe(100);
  });

  it('computes metrics for zero score (balanced)', () => {
    const result = computeDimensionMetrics(0);
    expect(result.leftPercentage).toBe(50);
    expect(result.rightPercentage).toBe(50);
    expect(result.isRightAligned).toBe(false);
    expect(result.dominantSide).toBe('balanced');
    expect(result.percentage).toBe(50);
  });

  it('computes metrics for positive score (0.5)', () => {
    const result = computeDimensionMetrics(0.5);
    expect(result.leftPercentage).toBe(25);
    expect(result.rightPercentage).toBe(75);
    expect(result.isRightAligned).toBe(true);
    expect(result.dominantSide).toBe('right');
    expect(result.percentage).toBe(75);
  });

  it('computes metrics for negative score (-0.5)', () => {
    const result = computeDimensionMetrics(-0.5);
    expect(result.leftPercentage).toBe(75);
    expect(result.rightPercentage).toBe(25);
    expect(result.isRightAligned).toBe(false);
    expect(result.dominantSide).toBe('left');
    expect(result.percentage).toBe(75);
  });

  it('clamps scores above 1 to 1', () => {
    const result = computeDimensionMetrics(2.5);
    expect(result.leftPercentage).toBe(0);
    expect(result.rightPercentage).toBe(100);
    expect(result.percentage).toBe(100);
  });

  it('clamps scores below -1 to -1', () => {
    const result = computeDimensionMetrics(-2.5);
    expect(result.leftPercentage).toBe(100);
    expect(result.rightPercentage).toBe(0);
    expect(result.percentage).toBe(100);
  });

  describe('positiveSkewsLeft flag', () => {
    it('inverts alignment when positiveSkewsLeft is true', () => {
      const result = computeDimensionMetrics(0.5, true);
      expect(result.leftPercentage).toBe(75);
      expect(result.rightPercentage).toBe(25);
      expect(result.isRightAligned).toBe(false);
      expect(result.dominantSide).toBe('left');
    });

    it('handles negative score with positiveSkewsLeft', () => {
      const result = computeDimensionMetrics(-0.5, true);
      expect(result.leftPercentage).toBe(25);
      expect(result.rightPercentage).toBe(75);
      expect(result.isRightAligned).toBe(true);
      expect(result.dominantSide).toBe('right');
    });

    it('handles balanced score with positiveSkewsLeft', () => {
      const result = computeDimensionMetrics(0, true);
      expect(result.leftPercentage).toBe(50);
      expect(result.rightPercentage).toBe(50);
      expect(result.dominantSide).toBe('balanced');
    });
  });
});

describe('getDimensionScore', () => {
  it('retrieves ei score from user', () => {
    const user = { ei: 0.5, sn: 0, tf: -0.5, pj: 1 } as ExtendedUser;
    expect(getDimensionScore(user, 'ei')).toBe(0.5);
  });

  it('retrieves sn score from user', () => {
    const user = { ei: 0.5, sn: -0.3, tf: -0.5, pj: 1 } as ExtendedUser;
    expect(getDimensionScore(user, 'sn')).toBe(-0.3);
  });

  it('handles null scores', () => {
    const user = { ei: null, sn: 0, tf: 0, pj: 0 } as ExtendedUser;
    expect(getDimensionScore(user, 'ei')).toBe(null);
  });
});

describe('computeAllDimensionMetrics', () => {
  it('computes metrics for all dimensions', () => {
    const user = {
      ei: 0.5,
      sn: -0.5,
      tf: 0,
      pj: 1,
    } as ExtendedUser;

    const results = computeAllDimensionMetrics(user);

    expect(results).toHaveLength(4);
    expect(results[0].key).toBe('ei');
    expect(results[1].key).toBe('sn');
    expect(results[2].key).toBe('tf');
    expect(results[3].key).toBe('pj');
  });

  it('includes both config and metrics in results', () => {
    const user = { ei: 0.5, sn: 0, tf: 0, pj: 0 } as ExtendedUser;
    const results = computeAllDimensionMetrics(user);

    const eiResult = results[0];
    expect(eiResult.leftLabel).toBe('Extrovert (E)');
    expect(eiResult.rightLabel).toBe('Introvert (I)');
    expect(eiResult.leftPercentage).toBe(75);
    expect(eiResult.rightPercentage).toBe(25);
  });

  it('handles users with null scores', () => {
    const user = { ei: null, sn: null, tf: null, pj: null } as ExtendedUser;
    const results = computeAllDimensionMetrics(user);

    results.forEach(result => {
      expect(result.dominantSide).toBe('balanced');
      expect(result.percentage).toBe(50);
    });
  });
});

describe('buildRadarData', () => {
  it('builds radar data from dimension metrics', () => {
    const user = { ei: 0.5, sn: -0.5, tf: 0, pj: 0.3 } as ExtendedUser;
    const dimensions = computeAllDimensionMetrics(user);
    const byKey = {
      ei: dimensions[0],
      sn: dimensions[1],
      tf: dimensions[2],
      pj: dimensions[3],
    };

    const radarData = buildRadarData(byKey);

    expect(radarData).toHaveLength(8);
    expect(radarData[0].axis).toBe('E');
    expect(radarData[0].dimensionKey).toBe('ei');
  });

  it('includes trait and complement labels and percentages', () => {
    const user = { ei: 0.5, sn: 0, tf: 0, pj: 0 } as ExtendedUser;
    const dimensions = computeAllDimensionMetrics(user);
    const byKey = {
      ei: dimensions[0],
      sn: dimensions[1],
      tf: dimensions[2],
      pj: dimensions[3],
    };

    const radarData = buildRadarData(byKey);
    const firstPoint = radarData[0];

    expect(firstPoint.traitLabel).toBe('Extrovert (E)');
    expect(firstPoint.complementLabel).toBe('Introvert (I)');
    expect(firstPoint.traitPercentage).toBe(75);
    expect(firstPoint.complementPercentage).toBe(25);
  });
});

describe('DIMENSION_CONFIG', () => {
  it('has exactly 4 dimensions', () => {
    expect(DIMENSION_CONFIG).toHaveLength(4);
  });

  it('has correct keys', () => {
    const keys = DIMENSION_CONFIG.map(d => d.key);
    expect(keys).toEqual(['ei', 'sn', 'tf', 'pj']);
  });

  it('only ei dimension has positiveSkewsLeft flag', () => {
    expect(DIMENSION_CONFIG[0].positiveSkewsLeft).toBe(true);
    expect(DIMENSION_CONFIG[1].positiveSkewsLeft).toBeUndefined();
    expect(DIMENSION_CONFIG[2].positiveSkewsLeft).toBeUndefined();
    expect(DIMENSION_CONFIG[3].positiveSkewsLeft).toBeUndefined();
  });
});

describe('RADAR_AXIS_ORDER', () => {
  it('has exactly 8 axes', () => {
    expect(RADAR_AXIS_ORDER).toHaveLength(8);
  });

  it('includes both sides for each dimension', () => {
    const eiAxes = RADAR_AXIS_ORDER.filter(a => a.key === 'ei');
    expect(eiAxes).toHaveLength(2);
    expect(eiAxes.some(a => a.side === 'left')).toBe(true);
    expect(eiAxes.some(a => a.side === 'right')).toBe(true);
  });
});
