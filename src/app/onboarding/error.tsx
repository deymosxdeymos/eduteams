'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Onboarding error:', error);
  }, [error]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-gray-900 mb-4'>
          Something went wrong!
        </h2>
        <p className='text-gray-600 mb-6'>
          We encountered an error during the onboarding process. Please try
          again.
        </p>
        <button
          onClick={reset}
          className='bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors'
        >
          Try again
        </button>
      </div>
    </div>
  );
}
