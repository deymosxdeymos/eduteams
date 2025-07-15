'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={signOut}
      disabled={isLoading}
      className='mt-3 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50'
    >
      {isLoading ? 'Signing out...' : 'Logout'}
    </button>
  );
}
