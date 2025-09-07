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

interface TopicData {
  name: string;
  value: number;
}

interface TopicPreferencesChartProps {
  data: TopicData[];
  teamsFormed: boolean;
  className?: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 30);
}

export function TopicPreferencesChart({
  data,
  teamsFormed,
  className,
}: TopicPreferencesChartProps) {
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};

    data.forEach((topic, i) => {
      const key = slugify(topic.name);
      const colors = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))',
      ];

      config[key] = {
        label: topic.name,
        color: colors[i % colors.length],
      };
    });

    return config;
  }, [data]);

  const chartData = useMemo(() => {
    const n = data.length || 1;
    const placeholder = Math.round(100 / n);

    return data.map(topic => ({
      name: slugify(topic.name),
      value: teamsFormed ? topic.value : placeholder,
      fill: `var(--color-${slugify(topic.name)})`,
      label: topic.name,
    }));
  }, [data, teamsFormed]);

  return (
    <div className={className}>
      <div className='mb-3'>
        <span className='text-neutral-500 font-light text-base block'>
          Grafik Rata-Rata
        </span>
        <h1 className='text-neutral-800 font-medium text-xl'>
          Preferensi Tugas
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
                innerRadius={0}
                outerRadius='80%'
                paddingAngle={0}
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
