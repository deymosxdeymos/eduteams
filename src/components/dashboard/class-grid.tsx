import type { ClassGridProps } from '@/types/dashboard';
import { ClassCard } from './class-card';

export function ClassGrid({
  classes = [],
  showNoResults = false,
}: ClassGridProps) {
  // Show "no results" message if search returned empty and we're in search mode
  if (showNoResults) {
    return (
      <div className='h-full flex items-center justify-center pt-4 pb-6'>
        <div className='text-center'>
          <p className='text-gray-500 text-lg font-medium'>
            Tidak ada kelas yang ditemukan
          </p>
          <p className='text-gray-400 text-sm mt-2'>
            Coba gunakan kata kunci yang berbeda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col pt-4 pb-6'>
      <div
        className='grid grid-cols-4 gap-6 overflow-y-auto flex-1'
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
        }}
      >
        {classes.map(classItem => (
          <ClassCard
            key={classItem.id}
            id={classItem.id}
            title={classItem.title}
            academicYear={classItem.academicYear}
            studentCount={classItem.studentCount}
            classCode={classItem.classCode}
          />
        ))}
      </div>
    </div>
  );
}
