'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import type { AssignmentStats } from '@/lib/stats/assignment';
import { TeamQualitySummary } from './team-quality-summary';

const GenderPieChart = dynamic(
  () =>
    import('@/components/dashboard/chart/gender-pie-chart').then(mod => ({
      default: mod.GenderPieChart,
    })),
  {
    loading: () => (
      <div className='flex-1 animate-pulse bg-gray-100 rounded-lg h-[200px]' />
    ),
  }
);

const MbtiBarChart = dynamic(
  () =>
    import('@/components/dashboard/chart/mbti-bar-chart').then(mod => ({
      default: mod.MbtiBarChart,
    })),
  {
    loading: () => (
      <div className='animate-pulse bg-gray-100 rounded-lg h-[180px] w-full max-w-[900px]' />
    ),
  }
);

const SkillsBarChart = dynamic(
  () =>
    import('@/components/dashboard/chart/skills-bar-chart').then(mod => ({
      default: mod.SkillsBarChart,
    })),
  {
    loading: () => (
      <div className='flex-1 animate-pulse bg-gray-100 rounded-lg h-[200px]' />
    ),
  }
);

const TopicPreferencesPieChart = dynamic(
  () =>
    import('@/components/dashboard/chart/topic-preferences-pie-chart').then(
      mod => ({ default: mod.TopicPreferencesPieChart })
    ),
  {
    loading: () => (
      <div className='flex-1 animate-pulse bg-gray-100 rounded-lg h-[200px]' />
    ),
  }
);

interface AssignmentChartsProps {
  stats: AssignmentStats;
  isStudent: boolean;
}

export function AssignmentCharts({ stats, isStudent }: AssignmentChartsProps) {
  const t = useTranslations('dashboard.assignment.charts');

  if (isStudent) return null;

  const isReady = stats.chartReady;

  return (
    <Suspense
      fallback={<div className='flex-1 animate-pulse bg-gray-100 rounded-xl' />}
    >
      {stats.teamQuality && stats.teamsFormed ? (
        <TeamQualitySummary metrics={stats.teamQuality} />
      ) : null}
      <div className='flex flex-col justify-start border shadow-sm rounded-xl p-4 shrink-0'>
        <div className='overflow-x-auto'>
          <MbtiBarChart
            stats={stats.mbti}
            ready={isReady}
            distributionLabel={t('distributionLabel')}
            personalityTitle={t('personalityTitle')}
          />
        </div>
      </div>

      <div className='flex gap-x-4 flex-1 min-h-0'>
        <div className='flex flex-col border shadow-sm rounded-xl p-4 flex-1 min-h-0'>
          <div className='shrink-0 mb-3'>
            <span className='text-neutral-500 font-light text-base block'>
              {t('averageLabel')}
            </span>
            <h1 className='text-neutral-800 font-medium text-xl'>
              {t('skillsTitle')}
            </h1>
          </div>
          <SkillsBarChart
            skills={stats.skills}
            skillsReady={stats.skillsReady}
          />
        </div>

        <div className='flex flex-col border shadow-sm rounded-xl p-4 flex-1 min-h-0'>
          <div className='shrink-0 mb-3'>
            <span className='text-neutral-500 font-light text-base block'>
              {t('averageLabel')}
            </span>
            <h1 className='text-neutral-800 font-medium text-xl'>
              {t('preferencesTitle')}
            </h1>
          </div>
          <TopicPreferencesPieChart
            topicPreferences={stats.topicPreferences}
            ready={isReady}
          />
        </div>

        <div className='flex flex-col border shadow-sm rounded-xl p-4 flex-1 min-h-0'>
          <div className='shrink-0 mb-3'>
            <span className='text-neutral-500 font-light text-base block'>
              {t('averageLabel')}
            </span>
            <h1 className='text-neutral-800 font-medium text-xl'>
              {t('genderTitle')}
            </h1>
          </div>
          <GenderPieChart gender={stats.gender} ready={isReady} />
        </div>
      </div>
    </Suspense>
  );
}
