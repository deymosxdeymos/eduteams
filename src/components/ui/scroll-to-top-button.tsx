'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let footerObserver: IntersectionObserver | null = null;
    let domObserver: MutationObserver | null = null;

    const watchFooter = () => {
      const footer = document.querySelector('footer');
      if (!footer) return false;

      footerObserver?.disconnect();
      footerObserver = new IntersectionObserver(([entry]) => {
        setIsVisible(entry?.isIntersecting ?? false);
      });
      footerObserver.observe(footer);
      return true;
    };

    if (!watchFooter()) {
      domObserver = new MutationObserver(() => {
        if (watchFooter()) {
          domObserver?.disconnect();
          domObserver = null;
        }
      });
      domObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      footerObserver?.disconnect();
      domObserver?.disconnect();
    };
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
