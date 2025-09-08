'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { ExtendedUser } from '@/lib/types';

interface JoinClassClientProps {
  user: ExtendedUser;
  token: string;
}

interface Course {
  id: string;
  namaMataKuliah: string;
  kelas: string;
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  dosen: {
    name: string;
  };
}

export function JoinClassClient({ user, token }: JoinClassClientProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  const handleJoinClass = async () => {
    // Check if user is a student
    if (user.role !== 'mahasiswa') {
      setError(
        'Only students can join classes. Please log in with a student account.'
      );
      return;
    }

    // Check if user has completed onboarding
    if (!user.isOnboarded) {
      setError('Please complete your profile setup before joining a class.');
      setTimeout(() => {
        router.push('/onboarding/role');
      }, 3000);
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch('/api/student/join-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join class');
      }

      setSuccess(data.message);
      setCourse(data.course);

      // Redirect to dashboard after successful join
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleGoToLogin = () => {
    router.push(`/?returnUrl=${encodeURIComponent(`/join-class/${token}`)}`);
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-accent py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <Logo color='black' className='justify-center mb-8' />
          <h2 className='mt-6 text-3xl font-extrabold text-accent-foreground'>
            Join Class
          </h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            You&apos;ve been invited to join a class
          </p>
        </div>

        <div className='bg-white p-8 rounded-lg shadow-md'>
          {/* User info */}
          <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
            <p className='text-sm text-gray-700'>
              <span className='font-medium'>Logged in as:</span> {user.name}
            </p>
            <p className='text-sm text-gray-600'>
              <span className='font-medium'>Role:</span>{' '}
              {user.role === 'mahasiswa' ? 'Student' : user.role}
            </p>
          </div>

          {/* Error state */}
          {error && (
            <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-sm text-red-700'>{error}</p>
              {user.role !== 'mahasiswa' && (
                <div className='mt-3 space-y-2'>
                  <Button
                    onClick={handleGoToLogin}
                    variant='outline'
                    size='sm'
                    className='w-full'
                  >
                    Login with Student Account
                  </Button>
                </div>
              )}
              {!user.isOnboarded && (
                <div className='mt-3'>
                  <p className='text-xs text-red-600'>
                    Redirecting to profile setup in 3 seconds...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Success state */}
          {success && course && (
            <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-700 font-medium'>{success}</p>
              <div className='mt-3 space-y-1'>
                <p className='text-sm text-gray-700'>
                  <span className='font-medium'>Course:</span>{' '}
                  {course.namaMataKuliah}
                </p>
                <p className='text-sm text-gray-700'>
                  <span className='font-medium'>Class:</span> {course.kelas}
                </p>
                <p className='text-sm text-gray-700'>
                  <span className='font-medium'>Instructor:</span>{' '}
                  {course.dosen.name}
                </p>
                <p className='text-sm text-gray-700'>
                  <span className='font-medium'>Period:</span>{' '}
                  {course.tahunAwalPeriode}/{course.tahunAkhirPeriode}
                </p>
              </div>
              <div className='mt-3'>
                <p className='text-xs text-blue-600'>
                  Redirecting to dashboard in 3 seconds...
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className='space-y-4'>
            {!success && !error && (
              <Button
                onClick={handleJoinClass}
                disabled={isJoining}
                variant='onboarding'
                className='w-full'
                size='lg'
              >
                {isJoining ? (
                  <>
                    <LoadingSpinner size='sm' className='mr-2' />
                    Joining Class...
                  </>
                ) : (
                  'Join Class'
                )}
              </Button>
            )}

            {success && (
              <Button
                onClick={handleGoToDashboard}
                variant='onboarding'
                className='w-full'
                size='lg'
              >
                Go to Dashboard
              </Button>
            )}

            {!success && (
              <Button
                onClick={handleGoToDashboard}
                variant='outline'
                className='w-full'
                size='lg'
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Token info for debugging */}
          <div className='mt-6 pt-4 border-t border-gray-200'>
            <p className='text-xs text-gray-500'>
              <span className='font-medium'>Invitation Token:</span>{' '}
              <code className='bg-blue-50 px-1 rounded'>{token}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
