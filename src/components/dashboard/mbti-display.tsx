import { Sparkle } from 'lucide-react';
import Image from 'next/image';

export function MBTIDisplay() {
  return (
    <div className='flex flex-col gap-2 self-stretch'>
      <div className='flex items-center justify-center border border-emerald-200 rounded-xl shadow-glow shadow-emerald-100 px-4 py-2'>
        <Sparkle
          className='text-emerald-400 rounded-md w-14 h-8 py-[1px]'
          size={12}
          fill='currentColor'
        />
        <Image src='/mbti-text/ENFP.svg' alt='ENFP' width={150} height={150} />
        <Sparkle
          className='text-emerald-400 rounded-md w-14 h-8 py-[1px]'
          size={12}
          fill='currentColor'
        />
      </div>
      <div className='flex items-center justify-center border border-emerald-200 rounded-xl shadow-glow shadow-emerald-100 p-4 flex-1'>
        <Image src='/mbti-type/ENFP.svg' alt='ENFP' width={150} height={150} />
      </div>
    </div>
  );
}
