'use client';

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
        throw new Error(result.error || 'Failed to join class');
      }

      setSuccessMessage(result.message || 'Successfully joined class!');
      setTimeout(() => {
        setIsOpen(false);
        setClassToken('');
        setSuccessMessage('');
        onClassJoined?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
              className='text-sm font-medium text-gray-900 block'
            >
              Kode Kelas
            </label>
            <InputRounded
              id='token'
              value={classToken}
              onChange={e => setClassToken(e.target.value)}
              placeholder='687ad8sa'
              disabled={isLoading}
              className='w-full'
            />
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
