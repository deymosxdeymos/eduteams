'use client';

import { Mars, Venus } from 'lucide-react';
import Image from 'next/image';
import type { ExtendedUser } from '@/lib/types';
import { getMBTIColorScheme } from '@/lib/utils/mbti-colors';
import { getMBTIType } from '@/lib/utils/mbti-helpers';
import { MBTIDisplay } from './mbti-display';
import { PersonalityMetrics } from './personality-metrics';
import { SkillPreferenceColumns } from './skill-preference-columns';

interface TeamMemberCardProps {
  member: ExtendedUser;
  topSkills: string[];
  preferredTopics: string[];
}

export function TeamMemberCard({
  member,
  topSkills,
  preferredTopics,
}: TeamMemberCardProps) {
  const mbtiType = getMBTIType(member);
  const colorScheme = getMBTIColorScheme(mbtiType);

  return (
    <div className='bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-200'>
      {/* Member Header */}
      <div className='flex items-center gap-4'>
        {mbtiType && (
          <Image
            src={`/mbti-logo-normalized/${mbtiType}.svg`}
            alt={`${mbtiType} Logo`}
            width={64}
            height={64}
          />
        )}
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <h3 className={`text-xl font-bold ${colorScheme.primaryText}`}>
              {member.name}
            </h3>
            {member.gender === 'FEMALE' ? (
              <Venus
                className='bg-pink-100 text-pink-600 border border-pink-300 rounded-md w-14 h-8 py-[1px]'
                size={12}
              />
            ) : (
              <Mars
                className='bg-blue-100 text-blue-600 border border-blue-300 rounded-md w-14 h-8 py-[1px]'
                size={12}
              />
            )}
          </div>
          {member.nim && (
            <p className={`text-sm ${colorScheme.primaryText}`}>
              NIM: {member.nim}
            </p>
          )}
        </div>
      </div>

      {/* Member Details Grid */}
      <div className='flex gap-4'>
        {/* Left: MBTI + Metrics */}
        <div className='flex gap-2 flex-shrink-0 flex-[2]'>
          <MBTIDisplay user={member} />
          <PersonalityMetrics user={member} />
        </div>

        {/* Right: Skills + Preferences */}
        <div className='flex-[1]'>
          <SkillPreferenceColumns
            topSkills={topSkills}
            preferredTopics={preferredTopics}
            colorScheme={colorScheme}
          />
        </div>
      </div>
    </div>
  );
}
