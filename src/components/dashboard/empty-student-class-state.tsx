'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getClientLocaleFromCookie, onLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import JoinClassModal from './join-class-modal';

interface EmptyStudentClassStateProps {
  onClassJoined?: () => void;
}

export function EmptyStudentClassState({
  onClassJoined,
}: EmptyStudentClassStateProps) {
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic message loading for i18n
  const [messages, setMessages] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const loadMessages = async (l: Locale) => {
      const dict = await getDictionary(l);
      setMessages(dict);
    };

    loadMessages(getClientLocaleFromCookie());

    const unsubscribe = onLocaleChange(newLocale => {
      loadMessages(newLocale);
    });

    return unsubscribe;
  }, []);

  if (!messages) {
    return null; // or a loading state
  }
  return (
    <div className='flex flex-col items-center justify-center gap-y-4 mx-auto h-full'>
      <Image
        src='/belum-kelas.svg'
        width={180}
        height={180}
        alt='belum kelas'
      />
      <div className='text-center'>
        <h1 className='text-3xl font-semibold text-gray-800 tracking-tight pb-2'>
          {messages.dashboard.emptyStates.student.title}
        </h1>
        <p className='text-gray-600 text-sm font-normal'>
          {messages.dashboard.emptyStates.student.description}
        </p>
      </div>
      <JoinClassModal onClassJoined={onClassJoined} />
    </div>
  );
}
