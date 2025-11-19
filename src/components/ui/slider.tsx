'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  showSteps = false,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  showSteps?: boolean;
}) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  );

  const steps = React.useMemo(() => {
    if (!showSteps || !step) return [];
    const count = Math.floor((max - min) / step);
    return Array.from({ length: count + 1 }, (_, i) => min + i * step);
  }, [showSteps, min, max, step]);

  return (
    <SliderPrimitive.Root
      data-slot='slider'
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      step={step}
      className={cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot='slider-track'
        className={cn(
          'bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5'
        )}
      >
        <SliderPrimitive.Range
          data-slot='slider-range'
          className={cn(
            'bg-neutral-300 absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full'
          )}
        />
        {showSteps &&
          steps.map(stepValue => {
            const percentage = ((stepValue - min) / (max - min)) * 100;
            return (
              <div
                key={stepValue}
                className='absolute h-1.5 w-1.5 rounded-full bg-white/50'
                style={{ left: `calc(${percentage}% - 3px)` }}
              />
            );
          })}
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot='slider-thumb'
          key={index}
          className='border-neutral-300 ring-ring/50 block size-4 shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50'
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
