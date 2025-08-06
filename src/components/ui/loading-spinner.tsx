import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

const bars = Array(12).fill(0);

export function LoadingSpinner({
  size = 'md',
  className,
  color,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  const spinnerSize = sizeMap[size];
  const spinnerColor = color || 'rgb(var(--color-blue-500) / 0.8)';

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{
        ['--spinner-size' as string]: `${spinnerSize}px`,
        ['--spinner-color' as string]: spinnerColor,
      }}
    >
      <div
        className='relative'
        style={{
          height: `${spinnerSize}px`,
          width: `${spinnerSize}px`,
        }}
      >
        {bars.map((_, i) => (
          <div
            key={`spinner-bar-${i}-${spinnerSize}`}
            className='absolute rounded-md'
            style={{
              background: `var(--spinner-color)`,
              height: '8%',
              left: '-10%',
              top: '-3.9%',
              width: '24%',
              animation: 'spin-fade 1.2s linear infinite',
              animationDelay: `-${1.2 - i * 0.1}s`,
              transform: `rotate(${i * 30}deg) translate(146%)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='flex flex-col items-center space-y-4'>
        <LoadingSpinner size='lg' />
        <p className='text-sm text-gray-600'>Loading...</p>
      </div>
    </div>
  );
}
