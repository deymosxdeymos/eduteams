'use client';

import { useEffect, useState } from 'react';
import type { ExtendedUser } from '@/lib/types';
import { WelcomeSplash } from './welcome-splash';

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
  const [showSplash, setShowSplash] = useState(shouldShowSplash);

  useEffect(() => {
    if (isFirstVisit) {
      // Clean up URL to remove firstVisit parameter
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [isFirstVisit]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <WelcomeSplash onAnimationComplete={handleSplashComplete} />;
  }

  return <>{children}</>;
}
