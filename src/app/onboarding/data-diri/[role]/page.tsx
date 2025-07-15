'use client';

import Logo from '@/components/logo';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import DataDiriForm from '@/components/onboarding/data-diri/data-diri-form';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';

export default function DataDiriPage() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as 'dosen' | 'mahasiswa';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: {
    namaLengkap: string;
    nim?: string;
    npm?: string;
    jenisKelamin: string;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/data-diri', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role,
        }),
      });

      if (response.ok) {
        // Save progress
        await fetch('/api/user/onboarding-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ step: 'data-diri' }),
        });

        // Navigate based on role
        if (role === 'mahasiswa') {
          router.push('/onboarding/kepribadian');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error submitting data-diri:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='bg-white min-h-screen'>
      <Logo color='black' />

      <div className='flex items-center justify-center space-x-2 pt-20'>
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          Isi data diri
        </h1>
        <Image
          src='/emoji/pencil.svg'
          width={80}
          height={80}
          alt='question icon'
        />
      </div>
      <div className='flex items-start justify-center py-14 px-8'>
        <DataDiriForm role={role} onSubmitAction={handleSubmit} />
      </div>
      <div className='flex items-center justify-center gap-x-6'>
        <Button
          variant='ghost'
          size='icon'
          className='rounded-full w-14 h-14 border border-black'
          onClick={() => router.push('/onboarding/role')}
        >
          <ArrowLeft strokeWidth={3} className='font-bold text-black text-lg' />
        </Button>
        <Button
          variant='onboarding'
          size='long'
          form='data-diri-form'
          type='submit'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Lanjut'}
          <ArrowRight
            strokeWidth={3}
            className='font-bold text-white text-lg'
          />
        </Button>
      </div>
    </main>
  );
}
