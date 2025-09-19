'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export function LoginButton() {
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
      className='w-fit rounded-full text-sm sm:text-lg py-8 px-10 transition-all duration-200 ease-out hover:scale-105 active:scale-95 disabled:scale-100 motion-reduce:transform-none [@media(hover:hover)_and_(pointer:fine)]:hover:scale-105 [@media(hover:hover)_and_(pointer:fine)]:active:scale-95'
      onClick={signIn}
      disabled={isLoading}
    >
      <Image
        src='/google.svg'
        alt='Google Logo'
        width={0}
        height={0}
        sizes='100vw'
        className='mr-2'
        style={{ width: '24px', height: '24px' }}
      />
      {isLoading ? 'Loading...' : 'Masuk dengan Google'}
    </Button>
  );
}
