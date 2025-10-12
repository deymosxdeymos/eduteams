import { useTranslations } from 'next-intl';

export function StudentStatisticsCards() {
  const t = useTranslations('dashboard.studentStats');

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div className='bg-white rounded-2xl p-6 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>
              {t('activeClasses')}
            </p>
            <p className='text-2xl font-bold text-gray-900'>0</p>
          </div>
          <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-6 h-6 text-blue-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              role='img'
              aria-label='Active classes icon'
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
      </div>

      <div className='bg-white rounded-2xl p-6 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>
              {t('pendingTasks')}
            </p>
            <p className='text-2xl font-bold text-gray-900'>0</p>
          </div>
          <div className='w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-6 h-6 text-yellow-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              role='img'
              aria-label='Pending tasks icon'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-2xl p-6 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>
              {t('completedTasks')}
            </p>
            <p className='text-2xl font-bold text-gray-900'>0</p>
          </div>
          <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-6 h-6 text-green-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              role='img'
              aria-label='Completed tasks icon'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
