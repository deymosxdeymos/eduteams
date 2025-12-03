import { cn } from '@/lib/utils';

interface MetricBarProps {
  leftLabel: string;
  rightLabel: string;
  percentage: number;
  isRightAligned?: boolean;
  colorScheme: {
    primaryBg: string;
    primaryText: string;
    primaryBorder: string;
  };
}

export function MetricBar({
  leftLabel,
  rightLabel,
  percentage,
  isRightAligned = false,
  colorScheme,
}: MetricBarProps) {
  const validPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center'>
        <span
          className={cn(
            'text-sm font-medium',
            !isRightAligned ? colorScheme.primaryText : 'text-black'
          )}
        >
          {leftLabel}
        </span>
        <span
          className={cn(
            'text-sm font-medium',
            isRightAligned ? colorScheme.primaryText : 'text-black'
          )}
        >
          {rightLabel}
        </span>
      </div>
      <div className='relative'>
        <div
          className={cn(
            'h-4 bg-white border rounded-full overflow-hidden',
            colorScheme.primaryBorder
          )}
        >
          <div
            className={cn(
              'h-full border-[1px] border-white transition-all rounded-full',
              colorScheme.primaryBg,
              isRightAligned && 'ml-auto'
            )}
            style={{ width: `${validPercentage}%` }}
          />
        </div>
        <span
          className={cn(
            'absolute top-0 right-0 left-0 bottom-0 flex items-center text-[10px] font-medium text-white',
            isRightAligned ? 'pl-2 justify-start' : 'justify-end pr-2'
          )}
          style={{
            maxWidth: `${validPercentage}%`,
            ...(isRightAligned && { marginLeft: 'auto' }),
          }}
        >
          {validPercentage}%
        </span>
      </div>
    </div>
  );
}
