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
  color = 'white',
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  const spinnerSize = sizeMap[size];

  return (
    <>
      <style>{`
        @keyframes spinner-fade {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0.15;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .spinner-bar {
            animation: none !important;
            opacity: 0.5;
          }
        }
      `}</style>
      <div
        className={cn('inline-block', className)}
        style={{
          height: `${spinnerSize}px`,
          width: `${spinnerSize}px`,
        }}
      >
        <div
          className='relative'
          style={{
            height: `${spinnerSize}px`,
            width: `${spinnerSize}px`,
            top: '50%',
            left: '50%',
          }}
        >
          {bars.map((_, i) => (
            <div
              key={`spinner-bar-${i}`}
              className='spinner-bar absolute left-[-10%] top-[-3.9%] h-[8%] w-[24%] rounded-md will-change-[opacity]'
              style={{
                background: color,
                animation: 'spinner-fade 0.8s linear infinite',
                animationDelay: `${-0.8 + i * (0.8 / 12)}s`,
                transform: `rotate(${i * 30}deg) translate(146%)`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export function LoadingPage() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='flex flex-col items-center space-y-4'>
        <LoadingSpinner size='lg' />
      </div>
    </div>
  );
}
