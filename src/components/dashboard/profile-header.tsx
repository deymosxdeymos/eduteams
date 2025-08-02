'use client';

import { Mars, Pencil, Venus } from 'lucide-react';
import Image from 'next/image';
import type { ExtendedUser } from '@/lib/types';
import { Button } from '../ui/button';

interface ProfileHeaderProps {
  user: ExtendedUser;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className='flex bg-gradient-to-r from-[#57AC78] to-[#6CEBA5] rounded-2xl items-center justify-between p-4'>
      <div className='flex items-center gap-4'>
        <Image
          src='/mbti-logo/ENFP.svg'
          alt={user.name}
          width={50}
          height={50}
        />
        <div className='flex gap-2 items-start justify-start'>
          <div className='flex flex-col items-start'>
            <h1 className='text-2xl text-white font-bold'>{user.name}</h1>
            <p className='text-base text-slate-200 font-medium'>
              NIM: {user.nimNpm}
            </p>
          </div>
          {user.gender === 'FEMALE' ? (
            <Venus
              className='bg-sky-300/20 border text-white rounded-md w-14 h-8 py-[1px]'
              size={12}
            />
          ) : (
            <Mars
              className='bg-sky-300/20 border text-white rounded-md w-14 h-8 py-[1px]'
              size={12}
            />
          )}
        </div>
      </div>
      <Button variant='outline' size='icon' className='rounded-full'>
        <Pencil className='w-4 h-4' />
      </Button>
    </div>
  );
}
