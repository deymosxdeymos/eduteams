import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-red-600'>
      <div className='w-full flex flex-col items-center justify-center p-6'>
        <Image
          src='/404.svg'
          alt='Not Found'
          width={900}
          height={900}
          className='mb-6'
        />
        <div className='text-center'>
          <p className='max-w-xl text-lg text-white mb-4 leading-tight'>
            Halaman ini tidak lagi tersedia atau telah dihapus. Jangan khawatir,
            kamu bisa kembali ke halaman utama untuk melanjutkan.
          </p>
          <Button
            asChild
            variant='outline'
            className='group rounded-full w-1/2 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg'
          >
            <Link href='/'>
              <ArrowLeft
                strokeWidth={3}
                className='w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1'
              />
              Kembali ke Halaman Utama
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
