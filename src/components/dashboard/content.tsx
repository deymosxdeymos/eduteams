import Image from 'next/image';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function Content() {
  return (
    <div className='h-full flex flex-col gap-4'>
      <div className='flex gap-4'>
        <div className='px-10 py-6 flex-1 bg-blue-100 rounded-3xl'>
          <h1 className='text-6xl font-bold text-sky-700'>0</h1>
          <p className='text-sky-900 text-base font-medium pt-4'>
            Total tugas telah dibuat
          </p>
        </div>
        <div className='px-10 py-6 flex-1 bg-emerald-100 rounded-3xl'>
          <h1 className='text-6xl font-bold text-emerald-700'>0</h1>
          <p className='text-emerald-900 text-base font-medium pt-4'>
            Total kelompok berhasil dibentuk
          </p>
        </div>
        <div className='px-10 py-6 flex-1 bg-amber-100 rounded-3xl'>
          <h1 className='text-6xl font-bold text-amber-700'>0</h1>
          <p className='text-amber-900 text-base font-medium pt-4'>
            Rata-rata skor kualitas kelompok
          </p>
        </div>
      </div>
      <div
        className='bg-white rounded-3xl p-6'
        style={{ height: 'calc(100% - 124px)' }}
      >
        <div className='flex justify-end'>
          <div className='flex items-center gap-3 px-6 py-3 border rounded-4xl w-86'>
            <input
              type='text'
              placeholder='Mencari sesuatu?'
              className='flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400'
            />
            <Search className='w-5 h-5 text-gray-400' />
          </div>
        </div>
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
      </div>
    </div>
  );
}
