interface StudentClass {
  id: string;
  namaMataKuliah: string;
  kelas: string;
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  dosen?: {
    name: string;
  };
}

interface StudentClassGridProps {
  classes: StudentClass[];
  showNoResults: boolean;
}

export function StudentClassGrid({
  classes,
  showNoResults,
}: StudentClassGridProps) {
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

  return (
    <div className='py-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {classes.map(classItem => (
          <div
            key={classItem.id}
            className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 hover:shadow-md transition-shadow'
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  role='img'
                  aria-label='Class icon'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                  />
                </svg>
              </div>
            </div>

            <h3 className='font-semibold text-gray-900 mb-2 text-lg leading-tight'>
              {classItem.namaMataKuliah}
            </h3>

            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-600'>Kelas</span>
                <span className='font-medium text-gray-900'>
                  {classItem.kelas}
                </span>
              </div>

              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-600'>Tahun Ajaran</span>
                <span className='font-medium text-gray-900'>
                  {classItem.tahunAwalPeriode}/{classItem.tahunAkhirPeriode}
                </span>
              </div>

              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-600'>Dosen</span>
                <span className='font-medium text-gray-900'>
                  {classItem.dosen?.name || 'N/A'}
                </span>
              </div>
            </div>

            <div className='mt-4 pt-4 border-t border-blue-200'>
              <button
                type='button'
                className='w-full bg-blue-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors'
              >
                Lihat Kelas
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
