'use client';

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function StatisticsCards() {
  const { data, error } = useSWR('/api/dashboard/statistics', fetcher);

  const statistics = data?.data || {
    totalAssignments: 0,
    totalTeams: 0,
    avgTeamQuality: 0,
  };

  if (error) {
    console.error('Failed to load statistics:', error);
  }
  return (
    <div className='flex gap-4'>
      <div className='px-10 py-6 flex-1 bg-blue-100 rounded-3xl'>
        <h1 className='text-6xl font-bold text-sky-700'>
          {statistics.totalAssignments}
        </h1>
        <p className='text-sky-900 text-base font-medium pt-4'>
          Total tugas telah dibuat
        </p>
      </div>
      <div className='px-10 py-6 flex-1 bg-emerald-100 rounded-3xl'>
        <h1 className='text-6xl font-bold text-emerald-700'>
          {statistics.totalTeams}
        </h1>
        <p className='text-emerald-900 text-base font-medium pt-4'>
          Total kelompok berhasil dibentuk
        </p>
      </div>
      <div className='px-10 py-6 flex-1 bg-amber-100 rounded-3xl'>
        <h1 className='text-6xl font-bold text-amber-700'>
          {Math.round(statistics.avgTeamQuality * 100) / 100}
        </h1>
        <p className='text-amber-900 text-base font-medium pt-4'>
          Rata-rata skor kualitas kelompok
        </p>
      </div>
    </div>
  );
}
