import { Button } from '@/components/ui/button';
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

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean;
}

export function LoadingButton({
  isLoading,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading && <LoadingSpinner size='sm' />}
      {children}
    </Button>
  );
}

export function LoadingPage() {
  return (
    <div
      className='flex min-h-screen items-center justify-center'
      role='status'
      aria-live='polite'
      aria-busy='true'
    >
      <div className='flex flex-col items-center gap-4'>
        <LoadingSpinner size='lg' />
        <span className='text-lg font-medium'>Loading...</span>
      </div>
    </div>
  );
}
