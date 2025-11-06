'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InputRounded } from '@/components/ui/input-rounded';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface JoinClassModalProps {
  onClassJoined?: () => void;
}

export default function JoinClassModal({ onClassJoined }: JoinClassModalProps) {
  const t = useTranslations('dashboard.modals.joinClass');
  const inputId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [classToken, setClassToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  const hasError = Boolean(error);

  const triggerShake = () => {
    setShakeKey(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classToken.trim()) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/student/join-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: classToken.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError(t('invalidCode'));
        } else {
          setError(result.error || t('invalidCode'));
        }
        triggerShake();
        return;
      }

      setSuccessMessage(result.message || 'Successfully joined class!');
      setTimeout(() => {
        setIsOpen(false);
        setClassToken('');
        setSuccessMessage('');
        onClassJoined?.();
      }, 1500);
    } catch {
      setError(t('invalidCode'));
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant='onboarding'
          size='lg'
          className='rounded-full px-4 py-6 font-semibold'
        >
          <Plus strokeWidth={3} className='w-5 h-5 mr-2' />
          {t('button')}
        </Button>
      </DialogTrigger>
      <DialogContent className='border max-w-md md:max-w-xl rounded-3xl p-0 gap-0'>
        <DialogHeader className='p-6 pb-4'>
          <DialogTitle className='text-xl font-semibold text-left'>
            {t('title')}
          </DialogTitle>
          <p className='text-gray-600 text-sm font-normal text-left mt-2'>
            {t('description')}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='p-6 pt-0 space-y-6'>
          <div className='space-y-3'>
            <label
              htmlFor='token'
              className={`text-sm font-medium block ${
                hasError ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {t('classCode')}
            </label>
            <motion.div
              key={shakeKey}
              animate={
                hasError
                  ? {
                      x: [-4, 4, -3, 3, -2, 2, 0],
                      transition: {
                        duration: 0.4,
                        ease: 'easeInOut',
                      },
                    }
                  : {}
              }
            >
              <InputRounded
                id={inputId}
                value={classToken}
                onChange={e => {
                  setClassToken(e.target.value);
                  if (error) setError('');
                }}
                placeholder={t('classCodePlaceholder')}
                disabled={isLoading}
                aria-invalid={hasError}
                className={`w-full ${
                  hasError
                    ? 'text-red-500 border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                    : ''
                }`}
              />
            </motion.div>
            {error && <p className='text-sm text-red-600 mt-2'>{error}</p>}
            {successMessage && (
              <p className='text-sm text-green-600 mt-2'>{successMessage}</p>
            )}
          </div>

          <Button
            type='submit'
            variant='onboarding'
            disabled={isLoading || !classToken.trim()}
            className='w-full rounded-full py-6 font-semibold'
          >
            {isLoading && <LoadingSpinner size='sm' className='mr-2' />}
            {isLoading ? t('joining') : t('join')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
