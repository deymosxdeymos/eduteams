import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyClassState() {
  return (
    <div className='flex flex-col items-center justify-center gap-y-4 mx-auto h-full'>
      <Image
        src='/belum-kelas.svg'
        width={180}
        height={180}
        alt='belum kelas'
      />
      <div className='text-center'>
        <h1 className='text-3xl font-semibold text-gray-800 tracking-tight pb-2'>
          Anda belum membuat kelas
        </h1>
        <p className='text-gray-600 text-sm font-normal'>
          Buat kelas untuk memulai pembagian kelompok
        </p>
      </div>
      <Button variant='onboarding' className='rounded-full w-48 py-7'>
        <Plus strokeWidth={3} className=' text-white' />
        <p className='text-white font-semibold text-base leading-tight'>
          Buat Kelas Baru
        </p>
      </Button>
    </div>
  );
}
