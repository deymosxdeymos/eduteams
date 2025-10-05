'use client';

import { useEffect, useRef } from 'react';

export function SkipLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // On mount, if the skip link is focused (e.g., after page refresh), blur it to hide it
    if (ref.current && document.activeElement === ref.current) {
      ref.current.blur();
    }
  }, []);

  return (
    <a
      ref={ref}
      href={href}
      className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 text-white z-50'
    >
      {children}
    </a>
  );
}
