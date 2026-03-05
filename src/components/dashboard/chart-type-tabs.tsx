'use client';

import { useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ColorScheme } from '@/lib/utils/mbti-colors';

interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface ChartTypeTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: TabOption<T>[];
  colorScheme: ColorScheme;
}

export function ChartTypeTabs<T extends string>({
  value,
  onChange,
  options,
  colorScheme,
}: ChartTypeTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!activeTabRef.current || !containerRef.current) return;

    const updateClipPath = () => {
      if (!activeTabRef.current || !containerRef.current) return;

      const { offsetLeft, offsetWidth } = activeTabRef.current;
      const containerWidth = containerRef.current.offsetWidth;
      if (containerWidth === 0) return;

      const leftPercent = (offsetLeft / containerWidth) * 100;
      const rightPercent =
        100 - ((offsetLeft + offsetWidth) / containerWidth) * 100;

      containerRef.current.style.clipPath = `inset(0 ${rightPercent}% 0 ${leftPercent}% round 8px)`;
    };

    updateClipPath();

    const resizeObserver = new ResizeObserver(updateClipPath);
    resizeObserver.observe(containerRef.current);
    resizeObserver.observe(activeTabRef.current);

    window.addEventListener('resize', updateClipPath);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateClipPath);
    };
  }, [value]);

  return (
    <div className='relative w-full'>
      <div
        className={cn(
          'flex gap-0 rounded-lg bg-white border shadow-glow',
          colorScheme.lightBorder,
          colorScheme.lightShadow
        )}
      >
        {options.map(option => (
          <button
            key={option.value}
            ref={value === option.value ? activeTabRef : null}
            type='button'
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 inline-flex items-center justify-center h-[34px] px-4',
              'text-sm font-medium whitespace-nowrap',
              'text-foreground bg-transparent border-none rounded-lg cursor-pointer',
              'outline-none transition-colors duration-200 ease-out',
              'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
              'hover:text-foreground/80',
              '[.touch_&]:hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        aria-hidden='true'
        className={cn(
          'absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none',
          'transition-[clip-path] duration-[250ms] will-change-[clip-path]',
          '[clip-path:inset(0_100%_0_0_round_8px)]',
          'motion-reduce:transition-none'
        )}
        style={{
          backgroundColor: colorScheme.gradientToOklch,
          transitionTimingFunction: 'cubic-bezier(0.77, 0, 0.175, 1)',
        }}
      >
        <div className='flex gap-0'>
          {options.map(option => (
            <button
              key={option.value}
              type='button'
              tabIndex={-1}
              className={cn(
                'flex-1 inline-flex items-center justify-center h-[34px] px-4',
                'text-sm font-medium whitespace-nowrap',
                'text-white bg-transparent border-none rounded-lg cursor-default'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
