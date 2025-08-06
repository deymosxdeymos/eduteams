'use client';

import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

interface CookieStoreAPI {
  getAll(): Promise<Array<{ name: string; value: string }>>;
  delete(name: string): Promise<void>;
}

export default function SessionClearClient() {
  const router = useRouter();

  useEffect(() => {
    const clearSession = async () => {
      try {
        await authClient.signOut();
        router.push('/');
      } catch (error) {
        console.error('Error clearing session:', error);
        // Fallback: clear cookies manually and redirect
        try {
          // Try to use modern Cookie Store API if available
          if (
            'cookieStore' in window &&
            (window as unknown as { cookieStore?: CookieStoreAPI }).cookieStore
          ) {
            const cookieStore = (
              window as unknown as { cookieStore: CookieStoreAPI }
            ).cookieStore;
            const cookies = await cookieStore.getAll();
            for (const cookie of cookies) {
              await cookieStore.delete(cookie.name);
            }
          } else {
            // Fall back to traditional cookie clearing
            document.cookie.split(';').forEach(c => {
              const name = c.replace(/^ +/, '').split('=')[0];
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            });
          }
        } catch (cookieError) {
          console.error('Error clearing cookies:', cookieError);
          // Final fallback - just redirect
        }
        router.push('/');
      }
    };

    clearSession();
  }, [router]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <Loader className='h-8 w-8 animate-spin mx-auto text-gray-600' />
        <p className='mt-4 text-gray-600'>Clearing session...</p>
      </div>
    </div>
  );
}
