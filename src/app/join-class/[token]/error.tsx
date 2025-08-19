'use client';

import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';

export default function JoinClassError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-accent py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <Logo color='black' className='justify-center mb-8' />
          <h2 className='mt-6 text-3xl font-extrabold text-accent-foreground'>
            Something went wrong
          </h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            We encountered an error while processing your class invitation
          </p>
        </div>

        <div className='bg-white p-8 rounded-lg shadow-md'>
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-sm text-red-700'>
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>

          <div className='space-y-4'>
            <Button
              onClick={reset}
              variant='onboarding'
              className='w-full'
              size='lg'
            >
              Try Again
            </Button>

            <Button
              onClick={() => (window.location.href = '/dashboard')}
              variant='outline'
              className='w-full'
              size='lg'
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
