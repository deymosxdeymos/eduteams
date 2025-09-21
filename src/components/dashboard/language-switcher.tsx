'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { setLocale } from '@/app/actions/set-locale';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
      className='px-2 py-3 sm:px-3 sm:py-4 lg:px-6 lg:py-7 rounded-full gap-x-1 sm:gap-x-2 lg:gap-x-4 min-w-fit overflow-hidden'
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await setLocale(nextLocale, { path: pathname || '/' });
          try {
            document.cookie = `lang=${nextLocale}; path=/; samesite=lax`;
          } catch {}
          emitLocaleChange(nextLocale);
          const currentPath = pathname || '/';
          const isEn = currentPath === '/en' || currentPath.startsWith('/en/');
          const normalized = isEn
            ? currentPath.replace(/^\/en(\/|$)/, '/').replace(/\/+/g, '/')
            : currentPath;
          const targetPath =
            nextLocale === 'en' ? `/en${normalized}` : normalized;
          router.push(targetPath);
          router.refresh();
        });
      }}
    >
      {isPending ? (
        <>
          <LoadingSpinner
            size='sm'
            className='mr-1 sm:mr-2'
            color='currentColor'
          />
          <span className='text-sm sm:text-lg lg:text-2xl text-stone-950 font-semibold'>
            {current.toUpperCase()}
          </span>
        </>
      ) : (
        <>
          <span className='text-sm sm:text-lg lg:text-2xl text-stone-950 font-semibold'>
            {current.toUpperCase()}
          </span>
          <Image
            src={current === 'id' ? '/indo.svg' : '/english.svg'}
            width={40}
            height={40}
            alt={
              current === 'id'
                ? messages?.dashboard?.languageSwitcher?.indonesiaAlt ||
                  'indonesia'
                : messages?.dashboard?.languageSwitcher?.englishAlt || 'english'
            }
            className='w-4 h-4 sm:w-5 sm:h-5 lg:w-10 lg:h-10 flex-shrink-0'
          />
        </>
      )}
    </Button>
  );
}
