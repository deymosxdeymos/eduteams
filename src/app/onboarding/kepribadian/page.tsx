'use client';

import Logo from '@/components/logo';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import InstructionModal from '@/components/onboarding/kepribadian/instruction-modal';

export default function KepribadianPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <main className='bg-white min-h-screen'>
      <InstructionModal isOpen={isModalOpen} onCloseAction={handleCloseModal} />

      <Logo color='black' />

      <div className='flex items-center justify-center space-x-2 pt-20'>
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          Kepribadian
        </h1>
        <Image
          src='/emoji/grimming-face.svg'
          width={80}
          height={80}
          alt='question icon'
        />
      </div>

      <div className='flex items-center justify-center gap-x-6 pt-20'>
        <Button
          variant='ghost'
          size='icon'
          className='rounded-full w-14 h-14 border border-black'
          onClick={() => router.push('/onboarding/data-diri/mahasiswa')}
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
