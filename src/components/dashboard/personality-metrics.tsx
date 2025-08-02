interface MetricBarProps {
  leftLabel: string;
  rightLabel: string;
  percentage: number;
  isRightAligned?: boolean;
}

function MetricBar({
  leftLabel,
  rightLabel,
  percentage,
  isRightAligned = false,
}: MetricBarProps) {
  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center'>
        <span
          className={`text-sm font-medium ${isRightAligned ? 'text-black' : 'text-emerald-500'}`}
        >
          {leftLabel}
        </span>
        <span
          className={`text-sm font-medium ${isRightAligned ? 'text-emerald-500' : 'text-black'}`}
        >
          {rightLabel}
        </span>
      </div>
      <div className='relative'>
        <div className='h-4 bg-white border border-emerald-400 rounded-full overflow-hidden'>
          <div
            className={`h-full bg-emerald-400 border-[1px] border-white transition-all rounded-full ${
              isRightAligned ? 'ml-auto' : ''
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span
          className={`absolute top-0 right-0 left-0 bottom-0 flex items-center text-[10px] font-medium text-white ${
            isRightAligned ? 'pl-2' : 'justify-end pr-2'
          }`}
          style={{
            maxWidth: `${percentage}%`,
            ...(isRightAligned && { marginLeft: 'auto' }),
          }}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export function PersonalityMetrics() {
  return (
    <div className='flex items-center justify-center border border-emerald-200 rounded-xl shadow-glow shadow-emerald-100 p-4 flex-1'>
      <div className='w-full space-y-6'>
        <MetricBar
          leftLabel='Extrovert (E)'
          rightLabel='Introvert (I)'
          percentage={60}
        />
        <MetricBar
          leftLabel='Sensing (S)'
          rightLabel='Intuition (N)'
          percentage={70}
          isRightAligned
        />
        <MetricBar
          leftLabel='Thinking (T)'
          rightLabel='Feeling (F)'
          percentage={80}
          isRightAligned
        />
        <MetricBar
          leftLabel='Judging (J)'
          rightLabel='Perceiving (P)'
          percentage={60}
          isRightAligned
        />
      </div>
    </div>
  );
}
