'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('joinClass');
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  const handleJoinClass = async () => {
    // Check if user is a student
    if (user.role !== 'mahasiswa') {
      setError(t('errors.studentsOnly'));
      return;
    }

    // Check if user has completed onboarding
    if (!user.isOnboarded) {
      setError(t('errors.completeProfile'));
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
        throw new Error(data.error || t('errors.joinFailed'));
      }

      setSuccess(data.message);
      setCourse(data.course);

      // Redirect to dashboard after successful join
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unexpected'));
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
            {t('title')}
          </h2>
          <p className='mt-2 text-sm text-muted-foreground'>{t('invited')}</p>
        </div>

        <div className='bg-white p-8 rounded-lg shadow-md'>
          {/* User info */}
          <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
            <p className='text-sm text-gray-700'>
              <span className='font-medium'>{t('loggedInAs')}</span> {user.name}
            </p>
            <p className='text-sm text-gray-600'>
              <span className='font-medium'>{t('role')}</span>{' '}
              {user.role === 'mahasiswa' ? t('roleStudent') : user.role}
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
                    {t('loginStudentAccount')}
                  </Button>
                </div>
              )}
              {!user.isOnboarded && (
                <div className='mt-3'>
                  <p className='text-xs text-red-600'>
                    {t('redirectingProfile')}
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
                  <span className='font-medium'>{t('courseInfo.course')}</span>{' '}
                  {course.namaMataKuliah}
                </p>
                <p className='text-sm text-gray-700'>
                  <span className='font-medium'>{t('courseInfo.class')}</span>{' '}
                  {course.kelas}
                </p>
                <p className='text-sm text-gray-700'>
                  <span className='font-medium'>
                    {t('courseInfo.instructor')}
                  </span>{' '}
                  {course.dosen.name}
                </p>
                <p className='text-sm text-gray-700'>
                  <span className='font-medium'>{t('courseInfo.period')}</span>{' '}
                  {course.tahunAwalPeriode}/{course.tahunAkhirPeriode}
                </p>
              </div>
              <div className='mt-3'>
                <p className='text-xs text-blue-600'>
                  {t('redirectingDashboard')}
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
                    {t('joiningClass')}
                  </>
                ) : (
                  t('title')
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
                {t('goToDashboard')}
              </Button>
            )}

            {!success && (
              <Button
                onClick={handleGoToDashboard}
                variant='outline'
                className='w-full'
                size='lg'
              >
                {t('cancel')}
              </Button>
            )}
          </div>

          {/* Token info for debugging */}
          <div className='mt-6 pt-4 border-t border-gray-200'>
            <p className='text-xs text-gray-500'>
              <span className='font-medium'>{t('invitationToken')}</span>{' '}
              <code className='bg-blue-50 px-1 rounded'>{token}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
