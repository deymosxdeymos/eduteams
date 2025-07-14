import * as React from 'react';
import Image from 'next/image';

interface LogoProps {
  color?: 'white' | 'black';
}

export default function Logo({ color = 'white' }: LogoProps) {
  const mainTextClass = color === 'black' ? 'text-black' : 'text-white';
  const spanTextClass = color === 'black' ? 'text-neutral-800' : 'text-white';

  return (
    <header className='flex flex-row justify-center items-center pt-10 w-full gap-2'>
      <Image src='/logo.png' width={50} height={50} alt='logo' />
      <p className={`${mainTextClass} text-3xl font-bold`}>
        Equi<span className={`${spanTextClass} font-light`}>Team</span>
      </p>
    </header>
  );
}
