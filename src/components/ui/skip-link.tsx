'use client';

export function SkipLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 text-white z-50'
    >
      {children}
    </a>
  );
}
