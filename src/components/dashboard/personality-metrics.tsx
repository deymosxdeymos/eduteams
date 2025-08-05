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

  console.log(`MetricBar ${leftLabel}/${rightLabel}:`, {
    originalPercentage: percentage,
    validPercentage,
    isRightAligned,
  });

  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center'>
        <span
          className={`text-sm font-medium ${isRightAligned ? 'text-black' : colorScheme.primaryText}`}
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

  // Convert MBTI scores from -1 to 1 range to percentages (0-100)
  // Handle null, undefined, and NaN values properly
  const eiPercentage =
    user.ei !== null && user.ei !== undefined && !Number.isNaN(user.ei)
      ? Math.round(((user.ei + 1) / 2) * 100)
      : 50;
  const snPercentage =
    user.sn !== null && user.sn !== undefined && !Number.isNaN(user.sn)
      ? Math.round(((user.sn + 1) / 2) * 100)
      : 50;
  const tfPercentage =
    user.tf !== null && user.tf !== undefined && !Number.isNaN(user.tf)
      ? Math.round(((user.tf + 1) / 2) * 100)
      : 50;
  const pjPercentage =
    user.pj !== null && user.pj !== undefined && !Number.isNaN(user.pj)
      ? Math.round(((user.pj + 1) / 2) * 100)
      : 50;

  console.log('Calculated percentages:', {
    eiPercentage,
    snPercentage,
    tfPercentage,
    pjPercentage,
  });

  return (
    <div
      className={`flex items-center justify-center border ${colorScheme.lightBorder} rounded-xl shadow-glow ${colorScheme.lightShadow} p-4 flex-1`}
    >
      <div className='w-full space-y-6'>
        <MetricBar
          leftLabel='Extrovert (E)'
          rightLabel='Introvert (I)'
          percentage={eiPercentage}
          isRightAligned={eiPercentage > 50}
          colorScheme={colorScheme}
        />
        <MetricBar
          leftLabel='Sensing (S)'
          rightLabel='Intuition (N)'
          percentage={snPercentage}
          isRightAligned={snPercentage > 50}
          colorScheme={colorScheme}
        />
        <MetricBar
          leftLabel='Thinking (T)'
          rightLabel='Feeling (F)'
          percentage={tfPercentage}
          isRightAligned={tfPercentage > 50}
          colorScheme={colorScheme}
        />
        <MetricBar
          leftLabel='Judging (J)'
          rightLabel='Perceiving (P)'
          percentage={pjPercentage}
          isRightAligned={pjPercentage > 50}
          colorScheme={colorScheme}
        />
      </div>
    </div>
  );
}
