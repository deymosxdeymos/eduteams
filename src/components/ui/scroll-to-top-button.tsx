'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting ?? false);
      },
      {
        root: null,
        threshold: 0,
      }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type='button'
      onClick={scrollToTop}
      className='scroll-top-button fixed bottom-8 left-8 z-50 cursor-pointer'
      aria-label='Scroll to top'
    >
      <ArrowUp className='h-5 w-5 text-black' />
      <ArrowUp className='h-5 w-5 text-black' />
    </button>
  );
}
