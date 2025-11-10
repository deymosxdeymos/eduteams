'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/dashboard/language-switcher';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import type { Course, ExtendedUser } from '@/lib/types';

interface NavProps {
  user: ExtendedUser;
  className?: Course;
  assignmentTitle?: string;
  answersCrumb?: string | boolean;
}

export default function Nav({
  user,
  className,
  assignmentTitle,
  answersCrumb,
}: NavProps) {
  const t = useTranslations();

  const isClassCurrent = !!className && !assignmentTitle && !answersCrumb;
  const isAssignmentCurrent = !!className && !!assignmentTitle && !answersCrumb;
  const isAnswersCurrent = !!className && !!assignmentTitle && !!answersCrumb;
  return (
    <div className='flex flex-row justify-between items-center px-3'>
      <div className='flex gap-x-10'>
        <Image
          src='/mascot-yellow-head.svg'
          width={52}
          height={56}
          alt='mascot'
          className='h-12 w-auto'
          style={{ width: 'auto' }}
          priority
        />
        <div className='leading-loose flex items-center'>
          {className ? (
            <div className='flex items-center gap-2'>
              <h1
                className={`text-xl ${isClassCurrent ? 'font-bold' : 'font-medium'} tracking-tight`}
              >
                {className.namaMataKuliah}
                {className.kelas ? ` - ${className.kelas}` : ''}
              </h1>
              {assignmentTitle ? (
                <>
                  <ChevronRight
                    strokeWidth={3}
                    className='w-5 h-5 text-black'
                  />
                  <h2
                    className={`text-xl ${isAssignmentCurrent ? 'font-bold' : 'font-medium'} tracking-tight`}
                  >
                    {assignmentTitle}
                  </h2>
                </>
              ) : null}
              {assignmentTitle && answersCrumb ? (
                <>
                  <ChevronRight
                    strokeWidth={3}
                    className='w-5 h-5 text-black'
                  />
                  <h3
                    className={`text-xl ${isAnswersCurrent ? 'font-bold' : 'font-medium'} tracking-tight`}
                  >
                    {typeof answersCrumb === 'string'
                      ? answersCrumb
                      : t('answersDefault')}
                  </h3>
                </>
              ) : null}
            </div>
          ) : (
            <div>
              <h1 className='text-3xl font-semibold tracking-tight'>
                {t('greeting', { name: user.name })}
              </h1>
              <p className='text-lg font-normal mt-2'>
                {canAccessMahasiswaFeatures(user)
                  ? t('mahasiswaSubtitle')
                  : t('dosenSubtitle')}
              </p>
            </div>
          )}
        </div>
      </div>
      <LanguageSwitcher />
    </div>
  );
}
