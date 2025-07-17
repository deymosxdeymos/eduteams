'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { WelcomeSplash } from './welcome-splash';

interface DashboardClientProps {
  children: React.ReactNode;
}

export function DashboardClient({ children }: DashboardClientProps) {
  const [showSplash, setShowSplash] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const firstVisit = searchParams.get('firstVisit') === 'true';
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeSplash');

    console.log('DashboardClient mounted:', { firstVisit, hasSeenWelcome });

    if (firstVisit && !hasSeenWelcome) {
      console.log('Showing splash screen');
      setShowSplash(true);

      // Mark as seen after animation completes
      const timer = setTimeout(() => {
        setShowSplash(false);
        localStorage.setItem('hasSeenWelcomeSplash', 'true');

        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);
  return (
    <>
      {showSplash && <WelcomeSplash />}
      {children}
    </>
  );
}
