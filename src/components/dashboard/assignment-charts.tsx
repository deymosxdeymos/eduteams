'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import type { AssignmentStats } from '@/lib/stats/assignment';
import { getDictionary } from '@/i18n/get-dictionary';
import { getClientLocaleFromCookie, onLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';

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
  // biome-ignore lint/suspicious/noExplicitAny: dynamic messages
  const [messages, setMessages] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const load = async (l: Locale) => {
      const dict = await getDictionary(l);
      setMessages(dict);
    };
    load(getClientLocaleFromCookie());
    const unsub = onLocaleChange(l => load(l));
    return unsub;
  }, []);

  if (isStudent) return null;

  return (
    <Suspense
      fallback={<div className='flex-1 animate-pulse bg-gray-100 rounded-xl' />}
    >
      <div className='flex flex-col justify-start border shadow-sm rounded-xl p-4 flex-shrink-0'>
        <div className='mb-2'>
          <span className='text-neutral-500 font-light text-base block'>
            {messages?.dashboard?.assignment?.charts?.distributionLabel ||
              'Grafik Persebaran'}
          </span>
          <h1 className='text-neutral-800 font-medium text-xl'>
            {messages?.dashboard?.assignment?.charts?.personalityTitle ||
              'Personality Mahasiswa'}
          </h1>
        </div>
        <div className='overflow-x-auto'>
          <MbtiBarChart stats={stats.mbti} teamsFormed={stats.teamsFormed} />
        </div>
      </div>

      <div className='flex gap-x-4 flex-1 min-h-0'>
        <div className='flex flex-col border shadow-sm rounded-xl p-4 flex-1 min-h-0'>
          <div className='flex-shrink-0 mb-3'>
            <span className='text-neutral-500 font-light text-base block'>
              {messages?.dashboard?.assignment?.charts?.averageLabel ||
                'Grafik Rata-Rata'}
            </span>
            <h1 className='text-neutral-800 font-medium text-xl'>
              {messages?.dashboard?.assignment?.charts?.skillsTitle ||
                'Keahlian Mahasiswa'}
            </h1>
          </div>
          <SkillsBarChart
            skills={stats.skills}
            teamsFormed={stats.teamsFormed}
          />
        </div>

        <div className='flex flex-col border shadow-sm rounded-xl p-4 flex-1 min-h-0'>
          <div className='flex-shrink-0 mb-3'>
            <span className='text-neutral-500 font-light text-base block'>
              {messages?.dashboard?.assignment?.charts?.averageLabel ||
                'Grafik Rata-Rata'}
            </span>
            <h1 className='text-neutral-800 font-medium text-xl'>
              {messages?.dashboard?.assignment?.charts?.preferencesTitle ||
                'Preferensi Tugas'}
            </h1>
          </div>
          <TopicPreferencesPieChart
            topicPreferences={stats.topicPreferences}
            teamsFormed={stats.teamsFormed}
          />
        </div>

        <div className='flex flex-col border shadow-sm rounded-xl p-4 flex-1 min-h-0'>
          <div className='flex-shrink-0 mb-3'>
            <span className='text-neutral-500 font-light text-base block'>
              {messages?.dashboard?.assignment?.charts?.averageLabel ||
                'Grafik Rata-Rata'}
            </span>
            <h1 className='text-neutral-800 font-medium text-xl'>
              {messages?.dashboard?.assignment?.charts?.genderTitle ||
                'Gender Mahasiswa'}
            </h1>
          </div>
          <GenderPieChart
            gender={stats.gender}
            teamsFormed={stats.teamsFormed}
          />
        </div>
      </div>
    </Suspense>
  );
}
