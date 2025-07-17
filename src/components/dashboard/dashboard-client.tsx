'use client';

import { useState, useEffect } from 'react';
import { WelcomeSplash } from './welcome-splash';

interface DashboardClientProps {
  children: React.ReactNode;
  isFirstTime: boolean;
}

export function DashboardClient({
  children,
  isFirstTime,
}: DashboardClientProps) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Check if user has already seen the welcome splash
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeSplash');

    if (isFirstTime && !hasSeenWelcome) {
      setShowSplash(true);

      // Mark as seen after animation completes
      const timer = setTimeout(() => {
        setShowSplash(false);
        localStorage.setItem('hasSeenWelcomeSplash', 'true');
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isFirstTime]);

  return (
    <>
      {showSplash && <WelcomeSplash />}
      {children}
    </>
  );
}
