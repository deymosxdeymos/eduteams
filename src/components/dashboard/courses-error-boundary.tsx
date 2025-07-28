'use client';

import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className='h-full flex flex-col pt-4 pb-6'>
      <div className='flex-1 flex items-center justify-center'>
        <div className='text-center'>
          <div className='flex justify-center mb-4'>
            <AlertCircle className='w-12 h-12 text-red-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Terjadi kesalahan
          </h3>
          <p className='text-gray-600 mb-4 max-w-md'>
            Gagal memuat data kelas. Silakan coba lagi atau hubungi administrator jika masalah berlanjut.
          </p>
          <button
            onClick={resetErrorBoundary}
            className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <RefreshCw className='w-4 h-4' />
            Coba lagi
          </button>
          <details className='mt-4 text-left'>
            <summary className='text-sm text-gray-500 cursor-pointer hover:text-gray-700'>
              Detail error
            </summary>
            <pre className='mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border overflow-auto'>
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}

interface CoursesErrorBoundaryProps {
  children: React.ReactNode;
}

export function CoursesErrorBoundary({ children }: CoursesErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Courses error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
