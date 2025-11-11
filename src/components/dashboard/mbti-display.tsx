'use client';

import { Sparkle } from 'lucide-react';
import Image from 'next/image';
import type { ExtendedUser } from '@/lib/types';
import { getMBTIColorScheme } from '@/lib/utils/mbti-colors';
import { getMBTIType } from '@/lib/utils/mbti-helpers';

interface MBTIDisplayProps {
  user: ExtendedUser;
}

export function MBTIDisplay({ user }: MBTIDisplayProps) {
  const mbtiType = getMBTIType(user);
  const colorScheme = getMBTIColorScheme(mbtiType);

  // If no MBTI type, show placeholder
  if (!mbtiType) {
    return (
      <div className='flex flex-col gap-2 self-stretch'>
        <div
          className={`flex items-center justify-center border ${colorScheme.lightBorder} rounded-xl shadow-glow ${colorScheme.lightShadow} px-4 py-2`}
        >
          <div className={`${colorScheme.primaryText} text-lg font-bold`}>
            Take Test
          </div>
        </div>
        <div
          className={`flex items-center justify-center border ${colorScheme.lightBorder} rounded-xl shadow-glow ${colorScheme.lightShadow} p-4 flex-1`}
        >
          <div className={`${colorScheme.primaryText} text-sm text-center`}>
            Complete your personality test to discover your MBTI type
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2 self-stretch'>
      <div
        className={`flex items-center justify-center border ${colorScheme.lightBorder} rounded-xl shadow-glow ${colorScheme.lightShadow} px-4 py-2`}
      >
        <Sparkle
          className={`${colorScheme.primaryText} rounded-md w-14 h-8 py-[1px]`}
          size={12}
          fill='currentColor'
        />
        <Image
          src={`/mbti-text/${mbtiType}.svg`}
          alt={mbtiType}
          width={150}
          height={150}
        />
        <Sparkle
          className={`${colorScheme.primaryText} rounded-md w-14 h-8 py-[1px]`}
          size={12}
          fill='currentColor'
        />
      </div>
      <div
        className={`flex items-center justify-center border ${colorScheme.lightBorder} rounded-xl shadow-glow ${colorScheme.lightShadow} p-4 flex-1`}
      >
        <Image
          src={`/mbti-type/${mbtiType}.svg`}
          alt={mbtiType}
          width={150}
          height={150}
        />
      </div>
    </div>
  );
}
