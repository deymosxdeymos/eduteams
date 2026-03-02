'use client';

import dynamic from 'next/dynamic';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from 'framer-motion';
import { useMemo, useState } from 'react';
import type { ExtendedUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CHART_DIMENSIONS, getMBTIColorScheme } from '@/lib/utils/mbti-colors';
import {
  buildRadarData,
  computeAllDimensionMetrics,
} from '@/lib/utils/mbti-dimension';
import { getMBTIType } from '@/lib/utils/mbti-helpers';
import { ChartTypeTabs } from './chart-type-tabs';
import { MetricBar } from './metric-bar';

const PersonalityRadarChart = dynamic(
  () =>
    import('./personality-radar-chart').then(mod => ({
      default: mod.PersonalityRadarChart,
    })),
  { ssr: false }
);

type ChartType = 'bar' | 'radar';

interface PersonalityMetricsProps {
  user: ExtendedUser;
}

export function PersonalityMetrics({ user }: PersonalityMetricsProps) {
  const mbtiType = getMBTIType(user);
  const colorScheme = getMBTIColorScheme(mbtiType);
  const shouldReduceMotion = useReducedMotion();
  const [{ chartType, direction }, setChartState] = useState<{
    chartType: ChartType;
    direction: number;
  }>({
    chartType: 'bar',
    direction: 1,
  });

  const handleChartTypeChange = (nextChartType: ChartType) => {
    setChartState(currentState => {
      if (currentState.chartType === nextChartType) {
        return currentState;
      }

      return {
        chartType: nextChartType,
        direction:
          currentState.chartType === 'bar' && nextChartType === 'radar'
            ? 1
            : -1,
      };
    });
  };

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
        onChange={handleChartTypeChange}
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
            custom={direction}
          >
            {chartType === 'bar' && (
              <motion.div
                key='bar-chart'
                variants={chartVariants}
                initial='initial'
                animate='animate'
                exit='exit'
                custom={direction}
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
                custom={direction}
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
