'use client';

import Logo from '@/components/logo';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import DataDiriForm from '@/components/onboarding/data-diri/data-diri-form';
import { useRouter } from 'next/navigation';

export default function DataDiriPage() {
  const router = useRouter();
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
        <DataDiriForm />
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
          onClick={() => router.push('/onboarding/kepribadian')}
        >
          Lanjut
          <ArrowRight
            strokeWidth={3}
            className='font-bold text-white text-lg'
          />
        </Button>
      </div>
    </main>
  );
}
