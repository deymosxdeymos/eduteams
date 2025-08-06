'use client';

import { Smile } from 'lucide-react';
import type { ExtendedUser } from '@/lib/types';
import { Button } from '../ui/button';
import { MBTIDisplay } from './mbti-display';
import { PersonalityDescription } from './personality-description';
import { PersonalityMetrics } from './personality-metrics';
import { ProfileHeader } from './profile-header';

interface ProfileContentProps {
  user: ExtendedUser;
}

export function ProfileContent({ user }: ProfileContentProps) {
  // Debug: Add user data logging
  console.log('ProfileContent user data:', {
    id: user.id,
    name: user.name,
    mbtiType: user.mbtiType,
    ei: user.ei,
    sn: user.sn,
    tf: user.tf,
    pj: user.pj,
    isOnboarded: user.isOnboarded,
  });

  return (
    <div className='bg-white rounded-3xl h-full flex flex-col overflow-hidden p-4 gap-4'>
      <ProfileHeader user={user} />
      <div className='flex justify-start items-stretch gap-2'>
        <MBTIDisplay user={user} />
        <PersonalityMetrics user={user} />
        <PersonalityDescription user={user} />
      </div>
      <Button
        variant='outline'
        className='rounded-full self-start border-2 border-black w-[19rem] h-[3rem]'
      >
        <Smile strokeWidth={3} />
        <p className='text-md text-stone-900 font-semibold'>
          Lihat Persebaran MBTI
        </p>
      </Button>
    </div>
  );
}
