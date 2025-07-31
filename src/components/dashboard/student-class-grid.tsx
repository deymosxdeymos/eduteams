'use client';

import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface StudentClass {
  id: string;
  namaMataKuliah: string;
  kelas: string;
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  studentCount: number; // Add student count
  dosen?: {
    name: string;
  };
}

interface StudentClassGridProps {
  classes: StudentClass[];
  showNoResults: boolean;
}

const getClassBadgeColor = (classCode: string) => {
  const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
    RA: { bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-800' },
    RB: { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-800' },
    RC: { bg: 'bg-pink-100', text: 'text-pink-800', dot: 'bg-pink-800' },
    RD: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-800' },
    RE: { bg: 'bg-lime-100', text: 'text-lime-800', dot: 'bg-lime-800' },
    'tanpa-kelas': {
      bg: 'bg-gray-50',
      text: 'text-gray-900',
      dot: 'bg-gray-900',
    },
  };

  return (
    colorMap[classCode] || {
      bg: 'bg-gray-50',
      text: 'text-gray-900',
      dot: 'bg-gray-900',
    }
  );
};

export function StudentClassGrid({
  classes,
  showNoResults,
}: StudentClassGridProps) {
  const router = useRouter();

  if (showNoResults) {
    return (
      <div className='flex flex-col items-center justify-center h-64 text-center'>
        <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
          <svg
            className='w-8 h-8 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            role='img'
            aria-label='Search icon'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          Tidak ada hasil
        </h3>
        <p className='text-gray-500'>Coba gunakan kata kunci yang berbeda</p>
      </div>
    );
  }

  const handleClassClick = (classId: string) => {
    router.push(`/dashboard/class/${classId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, classId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClassClick(classId);
    }
  };

  return (
    <div className='py-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {classes.map(classItem => {
          const badgeColors = getClassBadgeColor(classItem.kelas);

          return (
            <div
              key={classItem.id}
              role='button'
              tabIndex={0}
              className='bg-white border border-gray-200 rounded-2xl p-6 w-[380px] h-46 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left'
              onClick={() => handleClassClick(classItem.id)}
              onKeyDown={e => handleKeyDown(e, classItem.id)}
            >
              <div className='flex flex-col h-full'>
                <div className='flex justify-between items-start mb-4'>
                  <div className='flex gap-2'>
                    {classItem.kelas !== 'tanpa-kelas' && (
                      <Badge
                        variant='destructive'
                        className={`${badgeColors.bg} ${badgeColors.text} text-xs`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${badgeColors.dot}`}
                        ></div>{' '}
                        {classItem.kelas}
                      </Badge>
                    )}
                    <Badge
                      variant='default'
                      className='rounded-2xl font-normal text-xs text-sky-900 bg-sky-50'
                    >
                      {classItem.studentCount} mahasiswa
                    </Badge>
                  </div>
                </div>
                <h3 className='font-semibold text-gray-800 text-2xl line-clamp-2 leading-tight flex-1'>
                  {classItem.namaMataKuliah}
                </h3>
                <div className='mt-auto space-y-2'>
                  <div className='flex items-center gap-2'>
                    <User className='w-4 h-4 text-gray-600' />
                    <span className='text-gray-600 text-sm'>
                      {classItem.dosen?.name || 'N/A'}
                    </span>
                  </div>
                  <p className='text-gray-600 text-sm'>
                    {classItem.tahunAwalPeriode}/{classItem.tahunAkhirPeriode}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
