import * as React from 'react';
import Image from 'next/image';

interface LogoProps {
  color?: 'white' | 'black';
  className?: string;
  size?: string;
}

export default function Logo({
  color = 'white',
  className,
  size = 'text-3xl',
}: LogoProps) {
  const mainTextClass = color === 'black' ? 'text-black' : 'text-white';
  const spanTextClass = color === 'black' ? 'text-neutral-800' : 'text-white';

  return (
    <header
      className={`flex flex-row items-center w-full gap-8 ${className || ''}`}
    >
      <Image
        src='/mascot-yellow-head.svg'
        width={50}
        height={50}
        alt='logo'
        className='w-auto h-auto'
      />
      <p className={`${mainTextClass} ${size} font-bold`}>
        Equi<span className={`${spanTextClass} font-light`}>Team</span>
      </p>
    </header>
  );
}
