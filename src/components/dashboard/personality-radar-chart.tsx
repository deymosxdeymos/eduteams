import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ColorScheme } from '@/lib/utils/mbti-colors';
import type { RadarDatum } from '@/lib/utils/mbti-dimension';

interface PersonalityRadarChartProps {
  data: RadarDatum[];
  colorScheme: ColorScheme;
  maxWidth?: number;
}

function formatRadarTooltip(value: unknown, item: unknown) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const payload =
    'payload' in item && item.payload && typeof item.payload === 'object'
      ? (item.payload as RadarDatum)
      : null;

  if (!payload) {
    return null;
  }

  const traitPercentage =
    typeof value === 'number'
      ? Math.round(value)
      : Math.round(payload.traitPercentage);

  return (
    <div className='flex flex-col gap-1'>
      <span className='font-medium text-foreground'>
        {payload.traitLabel}: {traitPercentage}%
      </span>
      <span className='text-foreground/70 text-xs'>
        {payload.complementLabel}: {Math.round(payload.complementPercentage)}%
      </span>
    </div>
  );
}

export function PersonalityRadarChart({
  data,
  colorScheme,
  maxWidth = 240,
}: PersonalityRadarChartProps) {
  const radarConfig: ChartConfig = {
    score: {
      label: 'Preferred Trait',
      color: colorScheme.chartColor,
    },
  };

  return (
    <ChartContainer
      config={radarConfig}
      className='mx-auto aspect-square w-full'
      style={{ maxWidth: `${maxWidth}px` }}
      aria-label='Personality dimensions radar chart'
    >
      <RadarChart data={data} startAngle={90} endAngle={-270}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent className='min-w-[12rem]' />}
          formatter={formatRadarTooltip}
        />
        <PolarGrid
          className='opacity-20'
          gridType='circle'
          radialLines={false}
          style={{ fill: 'var(--color-score)' }}
        />
        <PolarAngleAxis
          dataKey='axis'
          tickLine={false}
          axisLine={false}
          tick={{ fontWeight: 600 }}
        />
        <Radar
          dataKey='score'
          stroke={colorScheme.chartColor}
          strokeOpacity={0.75}
          fill={colorScheme.chartColor}
          fillOpacity={0.35}
          strokeWidth={2}
        />
      </RadarChart>
    </ChartContainer>
  );
}
