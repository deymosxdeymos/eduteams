'use client';

import { Smile, Trash2, X } from 'lucide-react';
import type { ExtendedUser } from '@/lib/types';
import { Button } from '../ui/button';
import { MBTIDisplay } from './mbti-display';
import { PersonalityDescription } from './personality-description';
import { PersonalityMetrics } from './personality-metrics';
import { ProfileHeader } from './profile-header';
import { useEffect, useState } from 'react';
import { getDictionary } from '@/i18n/get-dictionary';
import { getClientLocaleFromCookie, onLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';

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
  // biome-ignore lint/suspicious/noExplicitAny: dynamic messages
  const [messages, setMessages] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const load = async (l: Locale) => {
      const dict = await getDictionary(l);
      setMessages(dict);
    };
    load(getClientLocaleFromCookie());
    const unsub = onLocaleChange(l => load(l));
    return unsub;
  }, []);
  return (
    <div
      className={`bg-white ${
        isModal ? 'rounded-3xl' : 'rounded-3xl'
      } flex flex-col p-4 gap-4`}
    >
      {/* Close button for modal */}
      {isModal && onClose && (
        <div className='flex justify-between items-center'>
          <div className='text-lg font-semibold text-stone-900'>
            {(messages?.dashboard?.profile?.studentProfileTitle || 'Profil {name}')
              .replace('{name}', student.name ?? 'Mahasiswa')}
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='rounded-full'
            onClick={onClose}
            aria-label={messages?.dashboard?.profile?.close || 'Tutup'}
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

      {/* Buttons row */}
      <div className='flex justify-between items-center gap-4 mb-0 pb-0'>
        <Button
          onClick={onShowMBTI}
          variant='outline'
          className='rounded-full border-2 border-black h-[3rem]'
        >
          <Smile strokeWidth={3} />
          <span className='text-md text-stone-900 font-semibold'>
            {messages?.dashboard?.profile?.viewMbtiDistribution ||
              'Lihat Persebaran MBTI'}
          </span>
        </Button>

        {canManage && onRemoveStudent && (
          <Button
            onClick={onRemoveStudent}
            variant='destructive'
            className='rounded-full h-[3rem]'
          >
            <Trash2 strokeWidth={2} />
            <span className='text-md font-semibold'>
              {messages?.dashboard?.profile?.removeStudent ||
                'Keluarkan Mahasiswa'}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
