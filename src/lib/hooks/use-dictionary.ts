'use client';

import { useEffect, useState } from 'react';
import { getDictionary } from '@/i18n/get-dictionary';
import { getClientLocaleFromCookie, onLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';

type Messages = Awaited<ReturnType<typeof getDictionary>>;

export function useDictionary() {
  const [messages, setMessages] = useState<Messages | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async (locale: Locale) => {
      setIsLoading(true);
      try {
        const dict = await getDictionary(locale);
        setMessages(dict);
      } catch (error) {
        console.error('Failed to load dictionary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages(getClientLocaleFromCookie());

    const unsubscribe = onLocaleChange(newLocale => {
      loadMessages(newLocale);
    });

    return unsubscribe;
  }, []);

  return { messages, isLoading };
}
