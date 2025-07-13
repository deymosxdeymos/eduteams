'use client';

import { createAuthClient } from 'better-auth/client';

const authClient = createAuthClient();

export function LoginButton() {
  const signIn = async () => {
    try {
      const data = await authClient.signIn.social({
        provider: 'google',
      });

      // For testing - just log the data
      console.log('Sign-in successful:', data);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <button
      onClick={signIn}
      className='relative text-center text-3xl font-semibold w-56 rounded-full bg-white p-4 text-blue-800'
    >
      Masuk
      <div className='absolute z-10 right-0'>
        <div className='rounded-sm before:rounded-full before:absolute before:-bottom-9.5 before:-left-17 before:h-14 before:w-7 before:rotate-42 before:transform before:border-r-2 before:border-t-2 before:border-white before:bg-white'></div>
      </div>
    </button>
  );
}
