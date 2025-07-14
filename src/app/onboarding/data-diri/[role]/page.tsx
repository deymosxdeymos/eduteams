import Logo from '@/components/logo';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import DataDiriForm from '@/components/onboarding/data-diri/data-diri-form';

export default function DataDiriPage() {
  return (
    <main className='bg-white min-h-screen'>
      <Logo color='black' />

      <div className='flex items-center justify-center space-x-2 pt-20'>
        <Image
          src='/emoji/grimming-face.svg'
          width={80}
          height={80}
          alt='question icon'
        />
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          Data Diri
        </h1>
      </div>
      <div className='flex items-start justify-center py-20 px-8'>
        <DataDiriForm />
      </div>
      <div className='flex items-center justify-center gap-x-2'>
        <Button
          variant='ghost'
          size='icon'
          className='rounded-full w-12 h-12 border border-black'
        >
          <ArrowLeft strokeWidth={3} className='font-bold text-black text-lg' />
        </Button>
        <Button variant='onboarding' size='long'>
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
