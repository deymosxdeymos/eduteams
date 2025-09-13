'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getClientLocaleFromCookie, onLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Course } from '@/lib/types';
import CreateClassModal from './create-class-modal';
import JoinClassModal from './join-class-modal';

interface SearchInputProps {
  onClassCreated?: (course?: Course) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  isStudent?: boolean;
}

export function SearchInput({
  onClassCreated,
  searchValue = '',
  onSearchChange = () => {},
  placeholder,
  isStudent = false,
}: SearchInputProps) {
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

  const defaultPlaceholder =
    messages?.dashboard?.search?.placeholder || 'Mencari sesuatu?';
  const actualPlaceholder = placeholder || defaultPlaceholder;
  return (
    <div className='flex justify-between items-center'>
      {isStudent ? (
        <JoinClassModal onClassJoined={() => onClassCreated?.()} />
      ) : (
        <CreateClassModal onClassCreated={onClassCreated} />
      )}
      <div className='flex items-center gap-3 px-6 py-3 border rounded-4xl w-86'>
        <input
          type='text'
          placeholder={actualPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          className='flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400'
        />
        <Search className='w-5 h-5 text-gray-400' />
      </div>
    </div>
  );
}
