'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface WelcomeSplashProps {
  onAnimationComplete?: () => void;
}

export function WelcomeSplash({ onAnimationComplete }: WelcomeSplashProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.8,
        ease: [0.43, 0.13, 0.23, 0.96], // Custom easing for smooth in/out
      }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-blue-600'
    >
      <motion.h1
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.9,
          y: isVisible ? 0 : -10,
        }}
        transition={{
          duration: 1.2,
          delay: 0.2,
          ease: [0.43, 0.13, 0.23, 0.96],
        }}
        className='text-6xl font-bold text-white'
      >
        Selamat Datang
      </motion.h1>
    </motion.div>
  );
}
