'use client';

interface SkillData {
  label: string;
  value: number;
}

interface SkillsChartProps {
  data: SkillData[];
  teamsFormed: boolean;
  className?: string;
}

export function SkillsChart({
  data,
  teamsFormed,
  className,
}: SkillsChartProps) {
  return (
    <div className={className}>
      <div className='mb-3'>
        <span className='text-neutral-500 font-light text-base block'>
          Grafik Rata-Rata
        </span>
        <h1 className='text-neutral-800 font-medium text-xl'>
          Keahlian Mahasiswa
        </h1>
      </div>

      <div className='flex flex-col gap-3 flex-1 justify-center'>
        {data.map((skill, i) => (
          <div className='flex items-center gap-8 w-full' key={i}>
            <div
              className='text-neutral-700 text-sm flex-shrink-0'
              style={{ width: '80px', whiteSpace: 'pre-wrap' }}
            >
              {skill.label.replace(/\s+/g, '\n')}
            </div>
            <div className='flex-1 h-3 rounded-full bg-neutral-200'>
              <div
                className='h-3 rounded-full bg-[#235ADF]'
                style={{
                  width: `${teamsFormed ? skill.value : 0}%`,
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
    </div>
  );
}
