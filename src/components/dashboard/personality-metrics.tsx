'use client';

import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useQueryState } from 'nuqs';
import { useMemo, useRef } from 'react';
import type { ExtendedUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CHART_DIMENSIONS, getMBTIColorScheme } from '@/lib/utils/mbti-colors';
import {
  buildRadarData,
  computeAllDimensionMetrics,
} from '@/lib/utils/mbti-dimension';
import { ChartTypeTabs } from './chart-type-tabs';
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

  const prevChartTypeRef = useRef<ChartType>(chartType);
  const directionRef = useRef<number>(1);

  if (prevChartTypeRef.current !== chartType) {
    directionRef.current =
      prevChartTypeRef.current === 'bar' && chartType === 'radar' ? 1 : -1;
    prevChartTypeRef.current = chartType;
  }

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
  }, [user]);

  const shouldReduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const chartVariants = {
    initial: (custom: number) => ({
      x: shouldReduceMotion ? 0 : `${100 * custom}%`,
      opacity: shouldReduceMotion ? 1 : 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: (custom: number) => ({
      x: shouldReduceMotion ? 0 : `${-100 * custom}%`,
      opacity: shouldReduceMotion ? 1 : 0,
    }),
  };

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <ChartTypeTabs
        value={chartType}
        onChange={setChartType}
        colorScheme={colorScheme}
        options={[
          { value: 'bar', label: 'Bar Chart' },
          { value: 'radar', label: 'Radar Chart' },
        ]}
      />

      <div
        className={cn(
          'rounded-xl p-4 bg-white border shadow-glow relative',
          colorScheme.lightBorder,
          colorScheme.lightShadow
        )}
        style={{
          minHeight: `${CHART_DIMENSIONS.minContentHeight}px`,
          overflow: 'clip',
        }}
      >
        <MotionConfig
          transition={{
            duration: 0.25,
            ease: [0.77, 0, 0.175, 1],
          }}
        >
          <AnimatePresence
            mode='wait'
            initial={false}
            custom={directionRef.current}
          >
            {chartType === 'bar' && (
              <motion.div
                key='bar-chart'
                variants={chartVariants}
                initial='initial'
                animate='animate'
                exit='exit'
                custom={directionRef.current}
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
              </motion.div>
            )}

            {chartType === 'radar' && (
              <motion.div
                key='radar-chart'
                variants={chartVariants}
                initial='initial'
                animate='animate'
                exit='exit'
                custom={directionRef.current}
                className='flex items-center justify-center'
              >
                <PersonalityRadarChart
                  data={radarData}
                  colorScheme={colorScheme}
                  maxWidth={CHART_DIMENSIONS.radarMaxWidth}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </MotionConfig>
      </div>
    </div>
  );
}
