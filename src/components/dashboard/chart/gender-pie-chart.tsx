import { Pie as RePie, PieChart as RePieChart } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { AssignmentStats } from '@/lib/stats/assignment';

interface GenderPieChartProps {
  gender: AssignmentStats['gender'];
  ready: boolean;
}

export function GenderPieChart({ gender, ready }: GenderPieChartProps) {
  // Match pre-refactor colors
  const config = {
    laki: { label: 'Laki-laki', color: 'oklch(from #3B82F6 l c h)' },
    perempuan: { label: 'Perempuan', color: 'oklch(from #E0C6FD l c h)' },
  };

  const placeholder = 50;
  const chartData = gender.map(g => ({
    name: g.name,
    value: ready ? g.value : placeholder,
    fill:
      g.name === 'laki'
        ? 'oklch(from #3B82F6 l c h)'
        : 'oklch(from #E0C6FD l c h)',
  }));

  return (
    <div className='flex flex-col flex-1 justify-center'>
      <div className='flex-1 flex items-center justify-center'>
        <ChartContainer
          config={config}
          className='w-full aspect-square max-h-[200px]'
        >
          <RePieChart>
            <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
            <RePie
              dataKey='value'
              nameKey='name'
              data={chartData}
              cx='50%'
              cy='50%'
              innerRadius='40%'
              outerRadius='80%'
              paddingAngle={0}
              stroke='none'
              strokeWidth={0}
            />
            <ChartLegend content={<ChartLegendContent nameKey='name' />} />
          </RePieChart>
        </ChartContainer>
      </div>
    </div>
  );
}
