import Image from 'next/image';
import type { Course } from '@/lib/types';
import CreateClassModal from './create-class-modal';

interface EmptyClassStateProps {
  onClassCreated?: (course: Course) => void;
}

export function EmptyClassState({ onClassCreated }: EmptyClassStateProps) {
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
      <CreateClassModal onClassCreated={onClassCreated} />
    </div>
  );
}
