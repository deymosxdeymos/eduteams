import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-7',
  };

  return <Spinner className={cn(sizeClasses[size], className)} />;
}

export function LoadingPage() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='flex flex-col items-center gap-4'>
        <LoadingSpinner size='lg' />
        <span className='text-lg font-medium'>Loading...</span>
      </div>
    </div>
  );
}
