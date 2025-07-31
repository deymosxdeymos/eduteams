'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InputRounded } from '@/components/ui/input-rounded';

interface JoinClassModalProps {
  onClassJoined?: () => void;
}

export default function JoinClassModal({ onClassJoined }: JoinClassModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [classToken, setClassToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [shakeKey, setShakeKey] = useState(0); // Key to trigger shake animation

  const hasError = Boolean(error);

  const triggerShake = () => {
    setShakeKey(prev => prev + 1); // Increment key to restart animation
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
        // Show specific error message for invalid token
        if (response.status === 404) {
          setError('Kode yang Anda masukkan salah. Silahkan coba lagi');
        } else {
          setError(
            result.error || 'Kode yang Anda masukkan salah. Silahkan coba lagi'
          );
        }
        triggerShake(); // Trigger shake animation on error
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
      setError('Kode yang Anda masukkan salah. Silahkan coba lagi');
      triggerShake(); // Trigger shake animation on error
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
          Masuk Kelas
        </Button>
      </DialogTrigger>
      <DialogContent className='border max-w-md md:max-w-xl rounded-3xl p-0 gap-0'>
        <DialogHeader className='p-6 pb-4'>
          <DialogTitle className='text-xl font-semibold text-left'>
            Masuk ke Kelas
          </DialogTitle>
          <p className='text-gray-600 text-sm font-normal text-left mt-2'>
            Masukkan kode kelas yang kamu dapatkan dari dosen untuk bergabung ke
            dalam kelas ini. Pastikan kode yang dimasukkan sudah benar, ya!
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
              Kode Kelas
            </label>
            <motion.div
              key={shakeKey} // Key changes to restart animation
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
                id='token'
                value={classToken}
                onChange={e => {
                  setClassToken(e.target.value);
                  if (error) setError(''); // Clear error when user types
                }}
                placeholder='687ad8sa'
                disabled={isLoading}
                aria-invalid={hasError}
                className={`w-full ${
                  hasError
                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
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
            {isLoading ? 'Masuk...' : 'Masuk'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
