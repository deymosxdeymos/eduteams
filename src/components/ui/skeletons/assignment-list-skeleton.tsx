import { Skeleton } from '@/components/ui/skeleton';

export function AssignmentListSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-9 w-36' />
      </div>
      <div className='space-y-3'>
        {[1, 2, 3].map(i => (
          <div key={i} className='rounded-lg border bg-card p-4'>
            <div className='flex items-start justify-between'>
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-5 w-64' />
                <Skeleton className='h-4 w-48' />
              </div>
              <Skeleton className='h-6 w-20' />
            </div>
            <div className='mt-3 flex gap-2'>
              <Skeleton className='h-5 w-16' />
              <Skeleton className='h-5 w-24' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
