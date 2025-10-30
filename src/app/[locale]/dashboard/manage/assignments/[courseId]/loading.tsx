import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Loading() {
  return (
    <div className='flex h-screen items-center justify-center bg-accent'>
      <LoadingSpinner size='lg' />
    </div>
  );
}
