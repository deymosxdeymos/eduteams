import type { AssignmentStats } from '@/lib/stats/assignment';

interface SkillsBarChartProps {
  skills: AssignmentStats['skills'];
  ready: boolean;
}

export function SkillsBarChart({ skills, ready }: SkillsBarChartProps) {
  return (
    <div className='flex flex-col gap-3 flex-1 justify-center'>
      {(skills.length > 0 ? skills : []).map((s, i) => (
        <div className='flex items-center gap-8 w-full' key={i}>
          <div
            className='text-neutral-700 text-sm flex-shrink-0'
            style={{ width: '80px', whiteSpace: 'pre-wrap' }}
          >
            {(s.label || '').replace(/\s+/g, '\n')}
          </div>
          <div className='flex-1 h-3 rounded-full bg-neutral-200'>
            <div
              className='h-3 rounded-full'
              style={{
                width: `${ready ? s.value : 0}%`,
                backgroundColor: 'oklch(from #235ADF l c h)',
              }}
            />
          </div>
        </div>
      ))}
      <div className='flex items-center gap-3 w-full text-neutral-400 text-xs mt-1'>
        <div style={{ width: '80px' }}></div>
        <div className='flex-1 flex justify-between'>
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
