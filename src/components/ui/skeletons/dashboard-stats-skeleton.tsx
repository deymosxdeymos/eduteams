import { Skeleton } from '@/components/ui/skeleton';

export function DashboardStatsSkeleton() {
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {[1, 2, 3].map(i => (
        <div key={i} className='rounded-lg border bg-card p-6'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='mt-3 h-8 w-20' />
          <Skeleton className='mt-2 h-3 w-24' />
        </div>
      ))}
    </div>
  );
}
