'use client';

import { useMemo } from 'react';
import { Pie, PieChart } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface GenderData {
  name: string;
  value: number;
}

interface GenderChartProps {
  data: GenderData[];
  teamsFormed: boolean;
  className?: string;
}

export function GenderChart({
  data,
  teamsFormed,
  className,
}: GenderChartProps) {
  const chartConfig = useMemo(
    (): ChartConfig => ({
      laki: {
        label: 'Laki-laki',
        color: 'hsl(var(--chart-1))',
      },
      perempuan: {
        label: 'Perempuan',
        color: 'hsl(var(--chart-2))',
      },
    }),
    []
  );

  const chartData = useMemo(() => {
    const placeholder = 50;
    return data.map(gender => ({
      name: gender.name,
      value: teamsFormed ? gender.value : placeholder,
      fill: `var(--color-${gender.name})`,
    }));
  }, [data, teamsFormed]);

  return (
    <div className={className}>
      <div className='mb-3'>
        <span className='text-neutral-500 font-light text-base block'>
          Grafik Rata-Rata
        </span>
        <h1 className='text-neutral-800 font-medium text-xl'>
          Gender Mahasiswa
        </h1>
      </div>

      <div className='flex flex-col flex-1 justify-center'>
        <div className='flex-1 flex items-center justify-center'>
          <ChartContainer
            config={chartConfig}
            className='w-full aspect-square max-h-[200px]'
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Pie
                dataKey='value'
                nameKey='name'
                data={chartData}
                cx='50%'
                cy='50%'
                innerRadius='40%'
                outerRadius='80%'
                paddingAngle={2}
                stroke='none'
                strokeWidth={0}
              />
            </PieChart>
          </ChartContainer>
        </div>

        <ChartLegend className='mt-2'>
          <ChartLegendContent />
        </ChartLegend>
      </div>
    </div>
  );
}
