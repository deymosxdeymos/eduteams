import Image from 'next/image';

interface LogoProps {
  color?: 'white' | 'black';
  className?: string;
  size?: string;
  imageSize?: string;
}

export default function Logo({
  color = 'white',
  className,
  size = 'text-3xl',
  imageSize = 'w-12 h-12',
}: LogoProps) {
  const mainTextClass = color === 'black' ? 'text-black' : 'text-white';
  const spanTextClass = color === 'black' ? 'text-neutral-800' : 'text-white';

  return (
    <header className={`flex flex-row items-center gap-8 ${className || ''}`}>
      <Image
        src='/mascot-yellow-head.svg'
        width={48}
        height={48}
        alt='logo'
        className={imageSize}
      />
      <p className={`${mainTextClass} ${size} font-bold`}>
        Equi<span className={`${spanTextClass} font-light`}>Team</span>
      </p>
    </header>
  );
}
