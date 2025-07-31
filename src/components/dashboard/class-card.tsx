'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface ClassCardProps {
  id: string;
  title: string;
  academicYear: string;
  studentCount: number;
  classCode: string;
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

export function ClassCard({
  id,
  title,
  academicYear,
  studentCount,
  classCode,
}: ClassCardProps) {
  const router = useRouter();
  const badgeColors = getClassBadgeColor(classCode);

  const handleClick = () => {
    router.push(`/dashboard/class/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role='button'
      tabIndex={0}
      className='bg-white border border-gray-200 rounded-2xl p-6 w-[380px] h-46 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left'
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className='flex flex-col h-full'>
        <div className='flex justify-between items-start mb-4'>
          <div className='flex gap-2'>
            {classCode !== 'tanpa-kelas' && (
              <Badge
                variant='destructive'
                className={`${badgeColors.bg} ${badgeColors.text} text-xs`}
              >
                <div className={`h-2 w-2 rounded-full ${badgeColors.dot}`}></div>{' '}
                {classCode}
              </Badge>
            )}
            <Badge
              variant='default'
              className='rounded-2xl font-normal text-xs text-sky-900 bg-sky-50'
            >
              {studentCount} mahasiswa
            </Badge>
          </div>
        </div>
        <h3 className='font-semibold text-gray-800 text-2xl line-clamp-2 leading-tight flex-1'>
          {title}
        </h3>
        <div className='mt-auto'>
          <p className='text-gray-600 text-sm'>{academicYear}</p>
        </div>
      </div>
    </div>
  );
}
