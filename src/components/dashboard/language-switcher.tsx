'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { setLocale } from '@/app/actions/set-locale';
import { Button } from '@/components/ui/button';
import { emitLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic message loading for i18n
  const [messages, setMessages] = useState<Record<string, any> | null>(null);
  const nextLocale: Locale = current === 'id' ? 'en' : 'id';

  useEffect(() => {
    const loadMessages = async () => {
      const dict = await getDictionary(current);
      setMessages(dict);
    };

    loadMessages();
  }, [current]);

  return (
    <Button
      variant='outline'
      size='sm'
      className='py-7 rounded-full gap-x-4'
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await setLocale(nextLocale, { path: pathname || '/' });
          emitLocaleChange(nextLocale);
          router.refresh();
        });
      }}
    >
      <h1 className='text-2xl text-stone-950 font-semibold'>
        {current.toUpperCase()}
      </h1>
      <Image
        src={current === 'id' ? '/indo.svg' : '/english.svg'}
        width={40}
        height={40}
        alt={
          current === 'id'
            ? messages?.dashboard?.languageSwitcher?.indonesiaAlt || 'indonesia'
            : messages?.dashboard?.languageSwitcher?.englishAlt || 'english'
        }
      />
    </Button>
  );
}
