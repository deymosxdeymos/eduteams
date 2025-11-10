'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface WelcomeSplashProps {
  onAnimationComplete?: () => void;
}

const DISPLAY_DURATION_MS = 1600;
const FADE_DURATION_MS = 420;
const BACKDROP_EASE: [number, number, number, number] = [
  0.25, 0.46, 0.45, 0.94,
]; // ease-out-quad
const HEADING_EASE: [number, number, number, number] = [0.215, 0.61, 0.355, 1]; // ease-out-cubic

export function WelcomeSplash({ onAnimationComplete }: WelcomeSplashProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      setIsVisible(false);
      onAnimationComplete?.();
      return;
    }

    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, DISPLAY_DURATION_MS);

    const completeTimer = window.setTimeout(() => {
      onAnimationComplete?.();
    }, DISPLAY_DURATION_MS + FADE_DURATION_MS);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onAnimationComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: FADE_DURATION_MS / 1000, ease: BACKDROP_EASE }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-blue-600'
    >
      <motion.h1
        initial={{ opacity: 0, scale: 0.82, y: 18 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.9,
          y: isVisible ? 0 : -12,
        }}
        transition={{
          duration: (FADE_DURATION_MS + 80) / 1000,
          delay: 0.1,
          ease: HEADING_EASE,
        }}
        className='text-6xl font-bold text-white'
      >
        Selamat Datang
      </motion.h1>
    </motion.div>
  );
}
