'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePathname, useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale() as 'id' | 'en';
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('dashboard.languageSwitcher');
  const nextLocale: 'id' | 'en' = current === 'id' ? 'en' : 'id';

  return (
    <Button
      variant='outline'
      size='sm'
      className={cn(
        'px-2 py-3 sm:px-3 sm:py-4 lg:px-6 lg:py-7 rounded-full gap-x-1 sm:gap-x-2 lg:gap-x-4 min-w-fit overflow-hidden',
        className
      )}
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.replace(pathname, { locale: nextLocale });
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
            alt={current === 'id' ? t('indonesiaAlt') : t('englishAlt')}
            className='w-4 h-4 sm:w-5 sm:h-5 lg:w-10 lg:h-10 flex-shrink-0'
          />
        </>
      )}
    </Button>
  );
}
