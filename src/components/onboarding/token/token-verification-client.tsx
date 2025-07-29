'use client';

import { Button } from '@/components/ui/button';
import { InputRounded } from '@/components/ui/input-rounded';
import { ArrowRight, ArrowLeft, Key } from 'lucide-react';
import { useState, useTransition } from 'react';
import { verifyDosenToken } from '@/lib/actions/token';
import Link from 'next/link';

export default function () {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    if (!token.trim()) {
      setError('Token tidak boleh kosong');
      return;
    }

    startTransition(async () => {
      try {
        setError('');
        await verifyDosenToken(formData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Terjadi kesalahan saat memverifikasi token');
        }
      }
    });
  };

  return (
    <div>
      <form action={handleSubmit} className='pt-20'>
        <div className='flex flex-col items-center justify-center space-y-18'>
          <div className='w-full max-w-xl space-y-2'>
            <label className='text-black text-xl font-normal'>
              Token Role Dosen
            </label>
            <div className='relative'>
              <Key className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black' />
              <InputRounded
                type='text'
                name='token'
                placeholder='Token Role Dosen'
                value={token}
                onChange={e => setToken(e.target.value)}
                disabled={isPending}
                className='pl-10 mt-2'
              />
            </div>
            {error && (
              <p className='text-red-500 text-sm mt-2 text-center'>{error}</p>
            )}
          </div>
        </div>
      </form>

      <div className='flex items-center justify-center gap-x-6 pt-18'>
        <Link href='/onboarding/role'>
          <Button
            variant='ghost'
            size='icon'
            className='rounded-full w-14 h-14 border border-black'
          >
            <ArrowLeft
              strokeWidth={3}
              className='font-bold text-black text-lg'
            />
          </Button>
        </Link>
        <Button
          onClick={() => {
            const form = document.querySelector('form');
            if (form) {
              const formData = new FormData(form);
              handleSubmit(formData);
            }
          }}
          variant='onboarding'
          size='long'
          className='w-[500px]'
          disabled={!token.trim() || isPending}
        >
          {isPending ? 'Memverifikasi...' : 'Lanjut'}
          <ArrowRight
            strokeWidth={3}
            className='font-bold text-neutral-400 text-lg'
          />
        </Button>
      </div>
    </div>
  );
}
