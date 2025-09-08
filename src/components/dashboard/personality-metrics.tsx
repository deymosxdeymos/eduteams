'use client';

import type { ExtendedUser } from '@/lib/types';
import { getMBTIColorScheme } from '@/lib/utils/mbti-colors';

interface MetricBarProps {
  leftLabel: string;
  rightLabel: string;
  percentage: number;
  isRightAligned?: boolean;
  colorScheme: {
    primaryBg: string;
    primaryText: string;
    primaryBorder: string;
  };
}

function MetricBar({
  leftLabel,
  rightLabel,
  percentage,
  isRightAligned = false,
  colorScheme,
}: MetricBarProps) {
  // Ensure percentage is a valid number and within bounds
  const validPercentage =
    Number.isNaN(percentage) || percentage < 0 || percentage > 100
      ? 50
      : percentage;

  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center'>
        <span
          className={`text-sm font-medium ${!isRightAligned ? colorScheme.primaryText : 'text-black'}`}
        >
          {leftLabel}
        </span>
        <span
          className={`text-sm font-medium ${isRightAligned ? colorScheme.primaryText : 'text-black'}`}
        >
          {rightLabel}
        </span>
      </div>
      <div className='relative'>
        <div
          className={`h-4 bg-white border ${colorScheme.primaryBorder} rounded-full overflow-hidden`}
        >
          <div
            className={`h-full ${colorScheme.primaryBg} border-[1px] border-white transition-all rounded-full ${
              isRightAligned ? 'ml-auto' : ''
            }`}
            style={{ width: `${validPercentage}%` }}
          />
        </div>
        <span
          className={`absolute top-0 right-0 left-0 bottom-0 flex items-center text-[10px] font-medium text-white ${
            isRightAligned ? 'pl-2' : 'justify-end pr-2'
          }`}
          style={{
            maxWidth: `${validPercentage}%`,
            ...(isRightAligned && { marginLeft: 'auto' }),
          }}
        >
          {validPercentage}%
        </span>
      </div>
    </div>
  );
}

interface PersonalityMetricsProps {
  user: ExtendedUser;
}

export function PersonalityMetrics({ user }: PersonalityMetricsProps) {
  const colorScheme = getMBTIColorScheme(user.mbtiType);

  // Debug: Log the user data to understand what we're getting
  console.log('PersonalityMetrics user data:', {
    mbtiType: user.mbtiType,
    ei: user.ei,
    sn: user.sn,
    tf: user.tf,
    pj: user.pj,
    eiType: typeof user.ei,
    snType: typeof user.sn,
  });

  // Given a score in [-1, 1], compute dominant-side percentage & alignment.
  const mkDominant = (
    score: number | null | undefined,
    isEIDimension: boolean = false
  ) => {
    if (score === null || score === undefined || Number.isNaN(score)) {
      return { percentage: 50, isRightAligned: false, left: 50, right: 50 };
    }
    const right = Math.round(((score + 1) / 2) * 100);
    const left = 100 - right;

    if (isEIDimension) {
      // EI dimension: negative = Introvert (right), positive = Extrovert (left)
      if (score < 0) {
        return { percentage: left, isRightAligned: true, left, right };
      }
      return { percentage: right, isRightAligned: false, left, right };
    } else {
      // SN, TF, PJ dimensions: negative = left side, positive = right side
      if (score < 0) {
        return { percentage: left, isRightAligned: false, left, right };
      }
      return { percentage: right, isRightAligned: true, left, right };
    }
  };

  const ei = mkDominant(user.ei, true); // EI dimension has special logic
  const sn = mkDominant(user.sn);
  const tf = mkDominant(user.tf);
  const pj = mkDominant(user.pj);

  console.log('Metric dominant view:', { ei, sn, tf, pj });

  return (
    <div
      className={`flex items-center justify-center border ${colorScheme.lightBorder} rounded-xl shadow-glow ${colorScheme.lightShadow} p-4 flex-1`}
    >
      <div className='w-full space-y-6'>
        <MetricBar
          leftLabel='Extrovert (E)'
          rightLabel='Introvert (I)'
          percentage={ei.percentage}
          isRightAligned={ei.isRightAligned}
          colorScheme={colorScheme}
        />
        <MetricBar
          leftLabel='Sensing (S)'
          rightLabel='Intuition (N)'
          percentage={sn.percentage}
          isRightAligned={sn.isRightAligned}
          colorScheme={colorScheme}
        />
        <MetricBar
          leftLabel='Thinking (T)'
          rightLabel='Feeling (F)'
          percentage={tf.percentage}
          isRightAligned={tf.isRightAligned}
          colorScheme={colorScheme}
        />
        <MetricBar
          leftLabel='Judging (J)'
          rightLabel='Perceiving (P)'
          percentage={pj.percentage}
          isRightAligned={pj.isRightAligned}
          colorScheme={colorScheme}
        />
      </div>
    </div>
  );
}
