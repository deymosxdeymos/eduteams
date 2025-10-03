'use client';

import { ChevronDown, ChevronUp, Dot } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function StatisticsCards() {
  const t = useTranslations('dashboard.statistics');

  const { data, error } = useSWR('/api/dashboard/statistics', fetcher);

  const statistics = data?.data || {
    totalAssignments: 0,
    totalTeams: 0,
    avgTeamQuality: 0,
    qualitySummary: { min: null, max: null, mean: null, n: 0 },
  };

  const { min, max, mean } = statistics.qualitySummary ?? {
    min: null,
    max: null,
    mean: null,
  };

  const formatPercent = useMemo(() => {
    return (value: number | null | undefined) => {
      if (value === null || value === undefined) return '0%';
      const pct = Math.round(value * 100);
      return `${pct}%`;
    };
  }, []);

  if (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Failed to load statistics:', error);
    }
  }

  return (
    <div className='flex gap-4'>
      <div className='px-10 py-6 flex-1 bg-blue-100 rounded-3xl'>
        <h1 className='text-6xl font-bold text-sky-700'>
          {statistics.totalAssignments}
        </h1>
        <p className='text-sky-900 text-base font-medium pt-4'>
          {t('totalAssignments')}
        </p>
      </div>
      <div className='px-10 py-6 flex-1 bg-emerald-100 rounded-3xl'>
        <h1 className='text-6xl font-bold text-emerald-700'>
          {statistics.totalTeams}
        </h1>
        <p className='text-emerald-900 text-base font-medium pt-4'>
          {t('totalTeams')}
        </p>
      </div>
      <div className='px-10 py-6 flex-1 bg-amber-100 rounded-3xl'>
        <h2 className='text-xl font-semibold text-amber-900 mb-4'>
          {t('qualityTitle')}
        </h2>
        <div className='grid grid-cols-3 gap-4 items-end'>
          <div className='flex flex-col items-start'>
            <div className='flex items-center gap-1.5 text-amber-900 text-sm font-medium'>
              <span>{t('min')}</span>
              <ChevronDown size={16} />
            </div>
            <h1 className='text-4xl font-semibold text-amber-700'>
              {formatPercent(min)}
            </h1>
          </div>
          <div className='flex flex-col items-start'>
            <div className='flex items-center gap-1.5 text-amber-900 text-sm font-medium'>
              <span>{t('max')}</span>
              <ChevronUp size={16} />
            </div>
            <h1 className='text-4xl font-semibold text-amber-700'>
              {formatPercent(max)}
            </h1>
          </div>
          <div className='flex flex-col items-start'>
            <div className='flex items-center gap-1.5 text-amber-900 text-sm font-medium'>
              <span>{t('mean')}</span>
              <Dot size={16} />
            </div>
            <h1 className='text-4xl font-semibold text-amber-700'>
              {formatPercent(mean)}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
