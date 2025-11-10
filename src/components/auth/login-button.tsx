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

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      type='button'
      variant='outline'
      className={cn(
        'w-fit rounded-full text-sm sm:text-lg py-8 px-10 cursor-pointer transition-all duration-200 ease-out motion-reduce:transform-none [@media(hover:hover)_and_(pointer:fine)]:hover:scale-105 [@media(hover:hover)_and_(pointer:fine)]:active:scale-95',
        className
      )}
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      <div className='mr-2 flex h-6 w-6 items-center justify-center'>
        {isLoading ? (
          <LoadingSpinner size='sm' />
        ) : (
          <Image
            src='/google.svg'
            alt='Google Logo'
            width={24}
            height={24}
            className='size-6'
          />
        )}
      </div>
      {t('signInWithGoogle')}
    </Button>
  );
}
