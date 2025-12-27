'use client';

import { Mars, Pencil, User, Venus } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { ExtendedUser } from '@/lib/types';
import { getMBTIColorScheme } from '@/lib/utils/mbti-colors';
import { getMBTIType } from '@/lib/utils/mbti-helpers';

interface ProfileHeaderProps {
  user: ExtendedUser;
  hideImage?: boolean;
  hideEditButton?: boolean;
}

export function ProfileHeader({
  user,
  hideImage = false,
  hideEditButton = false,
}: ProfileHeaderProps) {
  const mbtiType = getMBTIType(user);
  const colorScheme = getMBTIColorScheme(mbtiType);

  // Create gradient based on MBTI category colors
  const gradientClass = `bg-gradient-to-r ${colorScheme.gradientFrom} ${colorScheme.gradientTo}`;

  return (
    <div
      className={`flex ${gradientClass} rounded-2xl items-center justify-between p-4`}
    >
      <div className='flex items-center gap-4'>
        {!hideImage &&
          (mbtiType ? (
            <Image
              src={`/mbti-logo-normalized/${mbtiType}.svg`}
              alt={`${mbtiType} Logo`}
              width={50}
              height={50}
              priority
            />
          ) : (
            <div className='w-[50px] h-[50px] bg-white/20 rounded-full flex items-center justify-center'>
              <User className='w-6 h-6 text-white' />
            </div>
          ))}
        <div className='flex gap-2 items-start justify-start'>
          <div className='flex flex-col items-start'>
            <h1 className='text-2xl text-white font-bold'>{user.name}</h1>
            {user.role === 'STUDENT' && user.nim && (
              <p className='text-base text-slate-200 font-medium'>
                NIM: {user.nim}
              </p>
            )}
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
      {!hideEditButton && (
        <Button variant='outline' size='icon' className='rounded-full'>
          <Pencil className='w-4 h-4' />
        </Button>
      )}
    </div>
  );
}
