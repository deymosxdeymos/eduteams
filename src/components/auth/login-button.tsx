'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface LoginButtonProps {
  className?: string;
}

export function LoginButton({ className }: LoginButtonProps) {
  const t = useTranslations('auth');
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    } catch (error) {
      console.error('Error signing in:', error);
      setIsLoading(false);
    }
  };
  return (
    <Button
      variant='outline'
      className={cn(
        'w-fit rounded-full text-sm sm:text-lg py-8 px-10 cursor-pointer transition-all duration-200 ease-out disabled:scale-100 motion-reduce:transform-none [@media(hover:hover)_and_(pointer:fine)]:hover:scale-105 [@media(hover:hover)_and_(pointer:fine)]:active:scale-95',
        className
      )}
      onClick={signIn}
      disabled={isLoading}
    >
      <div className='relative mr-2 size-6'>
        <Image
          src='/google.svg'
          alt='Google Logo'
          width={24}
          height={24}
          className={cn('size-6', isLoading && 'opacity-0')}
        />
        {isLoading && (
          <LoadingSpinner
            size='sm'
            className='absolute inset-0 size-6'
            color='currentColor'
          />
        )}
      </div>
      {t('signInWithGoogle')}
    </Button>
  );
}
