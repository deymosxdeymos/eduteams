import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { ExtendedUser } from '@/lib/types';

interface NavProps {
  user: ExtendedUser;
}

export default function Nav({ user }: NavProps) {
  return (
    <div className='flex flex-row justify-between items-center px-3'>
      <div className='flex gap-x-10'>
        <Image
          src='/mascot-yellow-head.svg'
          width={50}
          height={50}
          alt='mascot'
        />
        {/* TODO: will make this nav working when in a class e.g Dashboard > Class Name */}
        <div className='leading-loose'>
          <h1 className='text-3xl font-semibold tracking-tight'>
            Halo, {user.name}!
          </h1>
          <p className='text-lg font-normal mt-2'>
            Explore information and activity about your lorem ipsum
          </p>
        </div>
      </div>
      <Button variant='outline' size='sm' className='py-7 rounded-full gap-x-4'>
        <h1 className='text-2xl text-stone-950 font-semibold'>ID</h1>
        <Image src='/indo.svg' width={40} height={40} alt='indonesia' />
      </Button>
    </div>
  );
}
