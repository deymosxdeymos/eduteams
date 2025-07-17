'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import LetterSwapForward from '@/components/ui/letter-swap-forward';

export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/onboarding/resume',
      });
    } catch (error) {
      console.error('Error signing in:', error);
      setIsLoading(false);
    }
  };
  return (
    <button
      onClick={signIn}
      disabled={isLoading}
      className='relative text-center text-3xl font-semibold w-56 rounded-full bg-white p-4 text-blue-800 transition-all duration-300 ease-out shadow-md hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95 active:translate-y-0 active:shadow-sm active:duration-75 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0'
    >
      <LetterSwapForward
        label={isLoading ? 'Loading...' : 'Masuk'}
        reverse={false}
        staggerFrom='center'
        transition={{
          type: 'spring',
          duration: 0.5,
        }}
        staggerDuration={0.05}
      />
      <div className='absolute z-10 right-0'>
        <div className='rounded-sm before:rounded-full before:absolute before:-bottom-9.5 before:-left-17 before:h-14 before:w-7 before:rotate-42 before:transform before:border-r-2 before:border-t-2 before:border-white before:bg-white'></div>
      </div>
    </button>
  );
}
