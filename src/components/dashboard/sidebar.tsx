'use client';

import { CircleUser, HomeIcon, LayoutGrid, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from '@/i18n/routing';
import { authClient } from '@/lib/auth-client';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  const handleManageClick = () => {
    router.push('/dashboard/manage');
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Helper function to determine if a route is active
  const isActive = (path: string) => {
    // Home (dashboard) should be active for all dashboard routes except profile
    if (path === '/dashboard') {
      return (
        !!pathname &&
        pathname.startsWith('/dashboard') &&
        !pathname.startsWith('/dashboard/profile') &&
        !pathname.startsWith('/dashboard/manage')
      );
    }
    return !!pathname && pathname.startsWith(path);
  };

  return (
    <div
      className='bg-white py-4 px-3 rounded-full flex flex-col justify-between items-center w-20 border'
      style={{ height: 'calc(100%)' }}
    >
      <div className='flex flex-col gap-y-6'>
        <Button
          variant={isActive('/dashboard') ? 'onboarding' : 'ghost'}
          size='icon'
          className='rounded-full w-12 h-12'
          onClick={handleDashboardClick}
        >
          <HomeIcon
            className={`size-5 ${isActive('/dashboard') ? 'text-white' : 'text-black'}`}
          />
        </Button>

        <Button
          variant={isActive('/dashboard/manage') ? 'onboarding' : 'ghost'}
          size='icon'
          className='rounded-full w-12 h-12'
          onClick={handleManageClick}
        >
          <LayoutGrid
            className={`size-5 ${isActive('/dashboard/manage') ? 'text-white' : 'text-black'}`}
          />
        </Button>
      </div>
      <div className='flex flex-col gap-y-6'>
        <Button
          variant={isActive('/dashboard/profile') ? 'onboarding' : 'ghost'}
          size='icon'
          className='rounded-full w-12 h-12'
          onClick={handleProfileClick}
        >
          <CircleUser
            className={`size-5 ${isActive('/dashboard/profile') ? 'text-white' : 'text-black'}`}
          />
        </Button>

        <Button
          variant='ghost'
          size='icon'
          className='rounded-full w-12 h-12'
          onClick={handleLogout}
        >
          <LogOut className='text-red-400 size-5' />
        </Button>
      </div>
    </div>
  );
}
