import { Badge } from '@/components/ui/badge';

interface ClassCardProps {
  title?: string;
  academicYear?: string;
  studentCount?: number;
  classCode?: string;
  isEmpty?: boolean;
}

export function ClassCard({
  title,
  academicYear,
  studentCount,
  classCode,
}: ClassCardProps) {
  return (
    <div className='bg-white border border-gray-200 rounded-2xl p-6 w-[363px] h-46 shadow-sm hover:shadow-md transition-shadow cursor-pointer'>
      <div className='flex flex-col h-full'>
        <div className='flex justify-between items-start mb-4'>
          <div className='flex gap-2'>
            <Badge
              variant='destructive'
              className='bg-red-50 text-red-900 text-xs'
            >
              <div className='h-2 w-2 rounded-full bg-red-900'></div>{' '}
              {classCode || 'RA'}
            </Badge>
            <Badge
              variant='default'
              className='rounded-2xl font-normal text-xs text-sky-900 bg-sky-50'
            >
              {studentCount || 24} mahasiswa
            </Badge>
          </div>
          <button className='text-gray-400 hover:text-gray-600'>
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
            </svg>
          </button>
        </div>
        <h3 className='font-semibold text-gray-800 text-2xl line-clamp-2 leading-tight flex-1'>
          {title || 'Kelas Contoh'}
        </h3>
        <div className='mt-auto'>
          <p className='text-gray-600 text-sm'>
            {academicYear || 'T.A 2025/2026'}
          </p>
        </div>
      </div>
    </div>
  );
}
