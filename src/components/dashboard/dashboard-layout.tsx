'use client';

import { useEffect, useState } from 'react';
import { getClientLocaleFromCookie, onLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import type { ExtendedUser } from '@/lib/types';
import Content from './content';
import Nav from './nav';
import Sidebar from './sidebar';
import { StudentDashboard } from './student-dashboard';

interface DashboardLayoutProps {
  user: ExtendedUser;
}

export function DashboardLayout({ user }: DashboardLayoutProps) {
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic message loading for i18n
  const [messages, setMessages] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const loadMessages = async (l: Locale) => {
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

  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  return (
    <main className='bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden'>
      <div className='mb-8'>
        <Nav user={user} />
      </div>
      <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
        <Sidebar />
        <div className='px-8 pb-0 min-h-0'>
          {isDosen && <Content />}
          {isMahasiswa && <StudentDashboard />}
          {!isDosen && !isMahasiswa && (
            <div className='flex items-center justify-center h-full'>
              <p className='text-muted-foreground'>
                {messages.dashboard.layout.unavailable}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
