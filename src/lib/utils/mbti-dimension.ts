import type { ExtendedUser } from '@/lib/types';

export type DimensionKey = 'ei' | 'sn' | 'tf' | 'pj';

export type DimensionConfig = {
  key: DimensionKey;
  leftLabel: string;
  rightLabel: string;
  leftKey: string;
  rightKey: string;
  positiveSkewsLeft?: boolean;
};

export type DominantSide = 'left' | 'right' | 'balanced';

export type DimensionMetrics = {
  percentage: number;
  isRightAligned: boolean;
  leftPercentage: number;
  rightPercentage: number;
  dominantSide: DominantSide;
  dominantPercentage: number;
};

export type DimensionWithMetrics = DimensionConfig & DimensionMetrics;

export type RadarAxisDescriptor = {
  key: DimensionKey;
  side: 'left' | 'right';
};

export type RadarDatum = {
  axis: string;
  score: number;
  traitLabel: string;
  traitPercentage: number;
  complementLabel: string;
  complementPercentage: number;
  dimensionKey: DimensionKey;
};

export const DIMENSION_CONFIG: DimensionConfig[] = [
  {
    key: 'ei',
    leftLabel: 'Extrovert (E)',
    rightLabel: 'Introvert (I)',
    leftKey: 'E',
    rightKey: 'I',
    positiveSkewsLeft: true,
  },
  {
    key: 'sn',
    leftLabel: 'Sensing (S)',
    rightLabel: 'Intuition (N)',
    leftKey: 'S',
    rightKey: 'N',
  },
  {
    key: 'tf',
    leftLabel: 'Thinking (T)',
    rightLabel: 'Feeling (F)',
    leftKey: 'T',
    rightKey: 'F',
  },
  {
    key: 'pj',
    leftLabel: 'Judging (J)',
    rightLabel: 'Perceiving (P)',
    leftKey: 'J',
    rightKey: 'P',
  },
];

export const RADAR_AXIS_ORDER: RadarAxisDescriptor[] = [
  { key: 'ei', side: 'left' },
  { key: 'sn', side: 'right' },
  { key: 'tf', side: 'left' },
  { key: 'pj', side: 'left' },
  { key: 'ei', side: 'right' },
  { key: 'sn', side: 'left' },
  { key: 'tf', side: 'right' },
  { key: 'pj', side: 'right' },
];

export function computeDimensionMetrics(
  score: number | null | undefined,
  positiveSkewsLeft = false
): DimensionMetrics {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return {
      percentage: 50,
      isRightAligned: false,
      leftPercentage: 50,
      rightPercentage: 50,
      dominantSide: 'balanced',
      dominantPercentage: 50,
    };
  }

  const clampedScore = Math.max(-1, Math.min(1, score));
  const scaled = Math.round(((clampedScore + 1) / 2) * 100);

  const leftPercentage = positiveSkewsLeft ? scaled : 100 - scaled;
  const rightPercentage = 100 - leftPercentage;

  if (leftPercentage === rightPercentage) {
    return {
      percentage: 50,
      isRightAligned: false,
      leftPercentage,
      rightPercentage,
      dominantSide: 'balanced',
      dominantPercentage: 50,
    };
  }

  const dominantSide = leftPercentage > rightPercentage ? 'left' : 'right';

  return {
    percentage: Math.max(leftPercentage, rightPercentage),
    isRightAligned: dominantSide === 'right',
    leftPercentage,
    rightPercentage,
    dominantSide,
    dominantPercentage: Math.max(leftPercentage, rightPercentage),
  };
}

export function getDimensionScore(
  user: ExtendedUser,
  key: DimensionKey
): number | null | undefined {
  return user[key];
}

export function computeAllDimensionMetrics(
  user: ExtendedUser
): DimensionWithMetrics[] {
  return DIMENSION_CONFIG.map(config => {
    const score = getDimensionScore(user, config.key);
    const metrics = computeDimensionMetrics(score, config.positiveSkewsLeft);

    return {
      ...config,
      ...metrics,
    };
  });
}

export function buildRadarData(
  dimensionMetricsByKey: Record<DimensionKey, DimensionWithMetrics>
): RadarDatum[] {
  return RADAR_AXIS_ORDER.map(({ key, side }) => {
    const dimension = dimensionMetricsByKey[key];
    const isLeftSide = side === 'left';

    const traitLabel = isLeftSide ? dimension.leftLabel : dimension.rightLabel;
    const traitPercentage = isLeftSide
      ? dimension.leftPercentage
      : dimension.rightPercentage;
    const complementLabel = isLeftSide
      ? dimension.rightLabel
      : dimension.leftLabel;
    const complementPercentage = isLeftSide
      ? dimension.rightPercentage
      : dimension.leftPercentage;

    return {
      axis: isLeftSide ? dimension.leftKey : dimension.rightKey,
      score: traitPercentage,
      traitLabel,
      traitPercentage,
      complementLabel,
      complementPercentage,
      dimensionKey: dimension.key,
    };
  });
}
