'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { ColorScheme } from '@/lib/utils/mbti-colors';

interface SkillPreferenceColumnsProps {
  topSkills: string[];
  preferredTopics: string[];
  colorScheme: ColorScheme;
}

export function SkillPreferenceColumns({
  topSkills,
  preferredTopics,
  colorScheme,
}: SkillPreferenceColumnsProps) {
  const t = useTranslations('dashboard.teams.teamDetail');

  return (
    <div className='flex gap-4 flex-1 h-full'>
      {/* Skills Column */}
      <div
        className={`flex-1 rounded-xl p-4 flex flex-col border ${colorScheme.lightBorder} shadow-glow ${colorScheme.lightShadow}`}
        style={{
          backgroundImage: `linear-gradient(to top right, white 50%, ${colorScheme.shadowColorOklch} 100%)`,
        }}
      >
        <Badge
          className={`${colorScheme.lightBg} ${colorScheme.primaryText} mb-3 text-sm px-3 py-1 rounded-full`}
          variant='secondary'
        >
          {t('topSkillsBadge')}
        </Badge>
        <div className='flex flex-col'>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            {t('topSkillsTitle')}
          </h3>
          <p className='text-xs text-gray-600 mb-3 h-12'>
            {t('topSkillsDesc')}
          </p>
          <div className='space-y-2'>
            {topSkills.slice(0, 2).map((skill, idx) => (
              <div key={idx} className='flex items-center gap-2'>
                <div
                  className={`flex-shrink-0 w-6 h-6 ${colorScheme.primaryBg} text-white rounded-full flex items-center justify-center text-xs font-bold`}
                >
                  {idx + 1}
                </div>
                <span className='text-sm text-gray-800 font-medium'>
                  {skill}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preferences Column */}
      <div
        className={`flex-1 rounded-xl p-4 flex flex-col border ${colorScheme.lightBorder} shadow-glow ${colorScheme.lightShadow}`}
        style={{
          backgroundImage: `linear-gradient(to top right, white 60%, ${colorScheme.shadowColorOklch} 100%)`,
        }}
      >
        <Badge
          className={`${colorScheme.lightBg} ${colorScheme.primaryText} mb-3 text-sm px-3 py-1 rounded-full`}
          variant='secondary'
        >
          {t('topPreferencesBadge')}
        </Badge>
        <div className='flex flex-col'>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            {t('topPreferencesTitle')}
          </h3>
          <p className='text-xs text-gray-600 mb-3 h-12'>
            {t('topPreferencesDesc')}
          </p>
          <div className='space-y-2'>
            {preferredTopics.slice(0, 2).map((topic, idx) => (
              <div key={idx} className='flex items-center gap-2'>
                <div
                  className={`flex-shrink-0 w-6 h-6 ${colorScheme.primaryBg} text-white rounded-full flex items-center justify-center text-xs font-bold`}
                >
                  {idx + 1}
                </div>
                <span className='text-sm text-gray-800 font-medium'>
                  {topic}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
