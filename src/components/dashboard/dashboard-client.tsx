'use client';

import { useEffect } from 'react';
import { WelcomeSplash } from './welcome-splash';
import { ExtendedUser } from '@/lib/types';

interface DashboardClientProps {
  children: React.ReactNode;
  user: ExtendedUser;
  shouldShowSplash: boolean;
  isFirstVisit: boolean;
}

export function DashboardClient({
  children,
  shouldShowSplash,
  isFirstVisit,
}: DashboardClientProps) {
  useEffect(() => {
    if (isFirstVisit) {
      // Clean up URL to remove firstVisit parameter
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [isFirstVisit]);

  if (shouldShowSplash) {
    return <WelcomeSplash />;
  }

  return <>{children}</>;
}
