'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const isFooterVisible = footerRect.top < window.innerHeight;
        setIsVisible(isFooterVisible);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
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
