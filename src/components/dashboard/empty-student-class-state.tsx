'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const JoinClassModal = dynamic(() => import('./join-class-modal'), {
  ssr: false,
});

interface EmptyStudentClassStateProps {
  onClassJoined?: () => void;
}

export function EmptyStudentClassState({
  onClassJoined,
}: EmptyStudentClassStateProps) {
  const t = useTranslations('dashboard.emptyStates.student');

  return (
    <div className='flex flex-col items-center justify-center gap-y-4 mx-auto h-full'>
      <Image
        src='/belum-kelas.svg'
        width={165}
        height={161}
        alt='belum kelas'
        className='w-[180px] h-auto'
        style={{ height: 'auto' }}
        priority
      />
      <div className='text-center'>
        <h1 className='text-3xl font-semibold text-gray-800 tracking-tight pb-2'>
          {t('title')}
        </h1>
        <p className='text-gray-600 text-sm font-normal'>{t('description')}</p>
      </div>
      <JoinClassModal onClassJoined={onClassJoined} />
    </div>
  );
}
