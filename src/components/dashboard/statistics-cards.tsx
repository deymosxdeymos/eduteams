'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { getClientLocaleFromCookie, onLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function StatisticsCards() {
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic message loading for i18n
  const [messages, setMessages] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const loadMessages = async (l: Locale) => {
      const dict = await getDictionary(l);
      setMessages(dict);
    };

    loadMessages(getClientLocaleFromCookie());

    const unsubscribe = onLocaleChange(newLocale => {
      loadMessages(newLocale);
    });

    return unsubscribe;
  }, []);

  const { data, error } = useSWR('/api/dashboard/statistics', fetcher);

  const statistics = data?.data || {
    totalAssignments: 0,
    totalTeams: 0,
    avgTeamQuality: 0,
  };

  if (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Failed to load statistics:', error);
    }
  }

  if (!messages) {
    return null; // or a loading state
  }
  return (
    <div className='flex gap-4'>
      <div className='px-10 py-6 flex-1 bg-blue-100 rounded-3xl'>
        <h1 className='text-6xl font-bold text-sky-700'>
          {statistics.totalAssignments}
        </h1>
        <p className='text-sky-900 text-base font-medium pt-4'>
          {messages.dashboard.statistics.totalAssignments}
        </p>
      </div>
      <div className='px-10 py-6 flex-1 bg-emerald-100 rounded-3xl'>
        <h1 className='text-6xl font-bold text-emerald-700'>
          {statistics.totalTeams}
        </h1>
        <p className='text-emerald-900 text-base font-medium pt-4'>
          {messages.dashboard.statistics.totalTeams}
        </p>
      </div>
      <div className='px-10 py-6 flex-1 bg-amber-100 rounded-3xl'>
        <h1 className='text-6xl font-bold text-amber-700'>
          {Math.round(statistics.avgTeamQuality * 100) / 100}
        </h1>
        <p className='text-amber-900 text-base font-medium pt-4'>
          {messages.dashboard.statistics.avgTeamQuality}
        </p>
      </div>
    </div>
  );
}
