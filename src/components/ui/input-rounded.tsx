import type * as React from 'react';

import { cn } from '@/lib/utils';

function InputRounded({
  className,
  type,
  id,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      id={id}
      data-slot='input'
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-12 w-full min-w-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20',
        'aria-invalid:border-red-500 aria-invalid:ring-red-500/20',
        className
      )}
      {...props}
    />
  );
}

export { InputRounded };
