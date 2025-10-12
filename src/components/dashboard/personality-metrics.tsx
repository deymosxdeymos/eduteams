'use client';

import { useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ExtendedUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CHART_DIMENSIONS, getMBTIColorScheme } from '@/lib/utils/mbti-colors';
import {
  buildRadarData,
  computeAllDimensionMetrics,
} from '@/lib/utils/mbti-dimension';
import { MetricBar } from './metric-bar';
import { PersonalityRadarChart } from './personality-radar-chart';

type ChartType = 'bar' | 'radar';

interface PersonalityMetricsProps {
  user: ExtendedUser;
}

export function PersonalityMetrics({ user }: PersonalityMetricsProps) {
  const colorScheme = getMBTIColorScheme(user.mbtiType);
  const [chartType, setChartType] = useQueryState<ChartType>('chart', {
    defaultValue: 'bar',
    parse: (value): ChartType => (value === 'radar' ? 'radar' : 'bar'),
    shallow: true,
  });

  const { dimensionMetrics, radarData } = useMemo(() => {
    const metrics = computeAllDimensionMetrics(user);
    const byKey = {
      ei: metrics[0],
      sn: metrics[1],
      tf: metrics[2],
      pj: metrics[3],
    };
    return {
      dimensionMetrics: metrics,
      radarData: buildRadarData(byKey),
    };
  }, [user.ei, user.sn, user.tf, user.pj]);

  return (
    <Tabs
      value={chartType}
      onValueChange={value => setChartType(value as ChartType)}
      className='flex flex-1 flex-col gap-4'
    >
      <TabsList className='w-full p-0'>
        <TabsTrigger
          value='bar'
          className='flex-1'
          style={{
            backgroundColor:
              chartType === 'bar' ? colorScheme.gradientToOklch : undefined,
            color: chartType === 'bar' ? 'white' : undefined,
          }}
        >
          Bar Chart
        </TabsTrigger>
        <TabsTrigger
          value='radar'
          className='flex-1'
          style={{
            backgroundColor:
              chartType === 'radar' ? colorScheme.gradientToOklch : undefined,
            color: chartType === 'radar' ? 'white' : undefined,
          }}
        >
          Radar Chart
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value='bar'
        className={cn(
          'rounded-xl p-4 shadow-glow bg-white border',
          colorScheme.lightBorder,
          colorScheme.lightShadow
        )}
        style={{ minHeight: `${CHART_DIMENSIONS.minContentHeight}px` }}
      >
        <div className='space-y-6'>
          {dimensionMetrics.map(dimension => (
            <MetricBar
              key={dimension.key}
              leftLabel={dimension.leftLabel}
              rightLabel={dimension.rightLabel}
              percentage={dimension.percentage}
              isRightAligned={dimension.isRightAligned}
              colorScheme={colorScheme}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent
        value='radar'
        className={cn(
          'flex items-center justify-center rounded-xl p-4 shadow-glow bg-white border',
          colorScheme.lightBorder,
          colorScheme.lightShadow
        )}
        style={{ minHeight: `${CHART_DIMENSIONS.minContentHeight}px` }}
      >
        <PersonalityRadarChart
          data={radarData}
          colorScheme={colorScheme}
          maxWidth={CHART_DIMENSIONS.radarMaxWidth}
        />
      </TabsContent>
    </Tabs>
  );
}
