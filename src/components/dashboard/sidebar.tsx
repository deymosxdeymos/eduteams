import { Button } from '@/components/ui/button';
import { HomeIcon, LayoutGrid, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  return (
    <div
      className='bg-white py-4 px-3 rounded-full flex flex-col justify-between items-center w-20 border shadow-sm'
      style={{ height: 'calc(100%)' }}
    >
      {/* TODO: make the button worked, onboarding for active*/}
      <div className='flex flex-col gap-y-6'>
        <Button
          variant='onboarding'
          size='icon'
          className='rounded-full w-12 h-12'
        >
          <HomeIcon className='text-white size-5' />
        </Button>

        <Button variant='ghost' size='icon' className='rounded-full w-12 h-12'>
          <LayoutGrid className='text-black size-5' />
        </Button>
      </div>
      <div className='flex flex-col gap-y-6'>
        <Button variant='ghost' size='icon' className='rounded-full w-12 h-12'>
          <Settings className='text-black size-5' />
        </Button>

        <Button variant='ghost' size='icon' className='rounded-full w-12 h-12'>
          <LogOut className='text-red-400 size-5' />
        </Button>
      </div>
    </div>
  );
}
