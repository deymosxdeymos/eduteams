import Logo from '@/components/logo';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import RoleSelect from '@/components/onboarding/role/role-select';
import { ArrowRight } from 'lucide-react';

export default function Home() {
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
          Pilih role kamu!
        </h1>
      </div>
      <div className='flex items-center justify-center space-y-2 py-20'>
        <RoleSelect />
      </div>
      <div className='flex items-center justify-center gap-x-2'>
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
