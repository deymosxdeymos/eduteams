'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { LanguageSwitcher } from '@/components/dashboard/language-switcher';
import { getClientLocaleFromCookie, onLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
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
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic message loading for i18n
  const [messages, setMessages] = useState<Record<string, any> | null>(null);
  const [locale, setLocale] = useState<Locale>('id');

  useEffect(() => {
    const loadMessages = async (l: Locale) => {
      setLocale(l);
      const dict = await getDictionary(l);
      setMessages(dict);
    };

    // initial load
    loadMessages(getClientLocaleFromCookie());

    // subscribe to locale changes
    const unsubscribe = onLocaleChange(newLocale => {
      loadMessages(newLocale);
    });

    return unsubscribe;
  }, []);

  if (!messages) {
    return null; // or a loading state
  }
  const isClassCurrent = !!className && !assignmentTitle && !answersCrumb;
  const isAssignmentCurrent = !!className && !!assignmentTitle && !answersCrumb;
  const isAnswersCurrent = !!className && !!assignmentTitle && !!answersCrumb;
  return (
    <div className='flex flex-row justify-between items-center px-3'>
      <div className='flex gap-x-10'>
        <Image
          src='/mascot-yellow-head.svg'
          width={50}
          height={50}
          alt='mascot'
        />
        <div className='leading-loose flex items-center'>
          {className ? (
            <div className='flex items-center gap-2'>
              {/* Class crumb (no leading chevron) */}
              <h1
                className={`text-xl ${isClassCurrent ? 'font-bold' : 'font-medium'} tracking-tight`}
              >
                {className.namaMataKuliah}
                {className.kelas ? ` - ${className.kelas}` : ''}
              </h1>
              {/* Assignment crumb */}
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
              {/* Answers crumb */}
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
                      : messages.answersDefault}
                  </h3>
                </>
              ) : null}
            </div>
          ) : (
            <div>
              <h1 className='text-3xl font-semibold tracking-tight'>
                {messages.greeting.replace('{name}', user.name)}
              </h1>
              <p className='text-lg font-normal mt-2'>
                {canAccessMahasiswaFeatures(user)
                  ? messages.mahasiswaSubtitle
                  : messages.dosenSubtitle}
              </p>
            </div>
          )}
        </div>
      </div>
      <LanguageSwitcher current={locale} />
    </div>
  );
}
