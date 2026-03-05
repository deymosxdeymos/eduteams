'use client';

import { useEffect, useState } from 'react';
import { WelcomeSplash } from './welcome-splash';

interface DashboardClientProps {
  children: React.ReactNode;
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

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Mark splash as seen after animation completes
    void fetch('/api/user/welcome-splash', {
      method: 'POST',
      keepalive: true,
    }).catch(() => {
      // non-critical telemetry-style call
    });
  };

  if (showSplash) {
    return <WelcomeSplash onAnimationComplete={handleSplashComplete} />;
  }

  return <>{children}</>;
}
