'use client';

import { useRef } from 'react';

interface SmoothScrollLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SmoothScrollLink({ href, children }: SmoothScrollLinkProps) {
  const animationIdRef = useRef<number | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      return;
    }

    e.preventDefault();
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (prefersReducedMotion) {
        targetElement.scrollIntoView({ behavior: 'auto' });
        window.history.pushState(null, '', href);
        return;
      }

      const start = window.scrollY;
      const target = targetElement.offsetTop;
      const distance = target - start;
      const duration = 500;
      let startTime: number | null = null;
      let userInterrupted = false;

      const easeOutCubic = (t: number): number => {
        return 1 - (1 - t) ** 3;
      };

      const handleInterrupt = () => {
        userInterrupted = true;
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }
        window.removeEventListener('wheel', handleInterrupt);
        window.removeEventListener('touchstart', handleInterrupt);
      };

      window.addEventListener('wheel', handleInterrupt, { passive: true });
      window.addEventListener('touchstart', handleInterrupt, { passive: true });

      const animation = (currentTime: number) => {
        if (userInterrupted) return;

        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const easing = easeOutCubic(progress);

        window.scrollTo(0, start + distance * easing);

        if (progress < 1) {
          animationIdRef.current = requestAnimationFrame(animation);
        } else {
          window.removeEventListener('wheel', handleInterrupt);
          window.removeEventListener('touchstart', handleInterrupt);
          window.history.pushState(null, '', href);
        }
      };

      animationIdRef.current = requestAnimationFrame(animation);
    }
  };

  return (
    <a href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
