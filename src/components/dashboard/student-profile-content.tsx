'use client';

import { Smile, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ExtendedUser } from '@/lib/types';
import { Button } from '../ui/button';
import { MBTIDisplay } from './mbti-display';
import { PersonalityDescription } from './personality-description';
import { PersonalityMetrics } from './personality-metrics';
import { ProfileHeader } from './profile-header';

interface StudentProfileContentProps {
  student: ExtendedUser;
  canManage?: boolean;
  onRemoveStudent?: () => void;
  onClose?: () => void;
  onShowMBTI?: () => void;
  isModal?: boolean;
}

export function StudentProfileContent({
  student,
  canManage = false,
  onRemoveStudent,
  onClose,
  onShowMBTI,
  isModal = false,
}: StudentProfileContentProps) {
  const t = useTranslations('dashboard.profile');

  return (
    <div
      className={`bg-white ${
        isModal ? 'rounded-3xl' : 'rounded-3xl'
      } flex flex-col p-4 gap-4`}
    >
      {isModal && onClose && (
        <div className='flex justify-between items-center'>
          <div className='text-lg font-semibold text-stone-900'>
            {t('studentProfileTitle', { name: student.name ?? 'Mahasiswa' })}
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='rounded-full'
            onClick={onClose}
            aria-label={t('close')}
          >
            <X className='w-5 h-5' />
          </Button>
        </div>
      )}

      <ProfileHeader
        user={student}
        hideImage={isModal}
        hideEditButton={isModal}
      />

      <div className='flex justify-start items-stretch gap-2'>
        <MBTIDisplay user={student} />
        <PersonalityMetrics user={student} />
        <PersonalityDescription user={student} />
      </div>

      <div className='flex justify-between items-center gap-4 mb-0 pb-0'>
        <Button
          onClick={onShowMBTI}
          variant='outline'
          className='rounded-full border-2 border-black h-[3rem]'
        >
          <Smile strokeWidth={3} />
          <span className='text-md text-stone-900 font-semibold'>
            {t('viewMbtiDistribution')}
          </span>
        </Button>

        {canManage && onRemoveStudent && (
          <Button
            onClick={onRemoveStudent}
            variant='destructive'
            className='rounded-full h-[3rem]'
          >
            <Trash2 strokeWidth={2} />
            <span className='text-md font-semibold'>{t('removeStudent')}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
