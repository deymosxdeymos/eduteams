'use client';

import { CircleUser, HomeIcon, LayoutGrid, LogOut } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from '@/i18n/routing';
import { authClient } from '@/lib/auth-client';

const SUPPORTED_LOCALES = ['id', 'en'];
const ICON_BUTTON_CLASSES =
  'rounded-full w-12 h-12 cursor-pointer transition-transform duration-150 active:scale-[0.96]';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const normalizedPathname = useMemo(() => {
    if (!pathname) return '/';

    const segments = pathname.split('/');
    const potentialLocale = segments[1];

    if (SUPPORTED_LOCALES.includes(potentialLocale ?? '')) {
      const rest = segments.slice(2).filter(Boolean).join('/');
      return rest ? `/${rest}` : '/';
    }

    return pathname;
  }, [pathname]);

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
    // Home (dashboard) should be active for all dashboard routes except profile and manage
    if (path === '/dashboard') {
      return (
        normalizedPathname.startsWith('/dashboard') &&
        !normalizedPathname.startsWith('/dashboard/profile') &&
        !normalizedPathname.startsWith('/dashboard/manage')
      );
    }
    // Manage should be active for all manage routes including tugas
    if (path === '/dashboard/manage') {
      return normalizedPathname.startsWith('/dashboard/manage');
    }
    return normalizedPathname.startsWith(path);
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
          className={ICON_BUTTON_CLASSES}
          onClick={handleDashboardClick}
          aria-current={isActive('/dashboard') ? 'page' : undefined}
        >
          <HomeIcon
            className={`size-5 ${isActive('/dashboard') ? 'text-white' : 'text-black'}`}
          />
        </Button>

        <Button
          variant={isActive('/dashboard/manage') ? 'onboarding' : 'ghost'}
          size='icon'
          className={ICON_BUTTON_CLASSES}
          onClick={handleManageClick}
          aria-current={isActive('/dashboard/manage') ? 'page' : undefined}
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
          className={ICON_BUTTON_CLASSES}
          onClick={handleProfileClick}
          aria-current={isActive('/dashboard/profile') ? 'page' : undefined}
        >
          <CircleUser
            className={`size-5 ${isActive('/dashboard/profile') ? 'text-white' : 'text-black'}`}
          />
        </Button>

        <Button
          variant='ghost'
          size='icon'
          className={ICON_BUTTON_CLASSES}
          onClick={handleLogout}
        >
          <LogOut className='text-red-400 size-5' />
        </Button>
      </div>
    </div>
  );
}
