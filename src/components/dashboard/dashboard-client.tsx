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
      const url = new URL(window.location.href);
      url.searchParams.delete('firstVisit');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [isFirstVisit]);

  const handleSplashComplete = async () => {
    setShowSplash(false);
    // Mark splash as seen after animation completes
    try {
      await fetch('/api/user/welcome-splash', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to update welcome splash status:', error);
      // Non-critical error, don't block user experience
    }
  };

  if (showSplash) {
    return <WelcomeSplash onAnimationComplete={handleSplashComplete} />;
  }

  return <>{children}</>;
}
