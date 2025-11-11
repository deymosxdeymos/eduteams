'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { AssignmentStats } from '@/lib/stats/assignment';

type MbtiType =
  | 'INTJ'
  | 'INTP'
  | 'ENTJ'
  | 'ENTP'
  | 'INFJ'
  | 'INFP'
  | 'ENFJ'
  | 'ENFP'
  | 'ISTJ'
  | 'ISFJ'
  | 'ESTJ'
  | 'ESFJ'
  | 'ISTP'
  | 'ISFP'
  | 'ESTP'
  | 'ESFP';

type IconTweak = {
  size?: number;
  dx?: number;
  dy?: number;
  anchor?: 'left' | 'center' | 'right';
  overlap?: number;
};

const ICON_TWEAKS: Partial<Record<MbtiType, IconTweak>> = {
  ESTP: { size: 52, dy: 7 },
  ENFJ: { size: 48, dy: 6 },
  ENTJ: { size: 48, dy: 3 },
  ENTP: { size: 48, dy: 3 },
  ENFP: { size: 48 },
  ESFJ: { size: 48, dy: 5 },
  INTP: { size: 48, dx: -3 },
  INFJ: { size: 48, dx: 3 },
};

const chartConfig = {
  jumlah: {
    label: 'Jumlah Mahasiswa',
  },
  intj: {
    label: 'INTJ - The Architect',
    color: 'oklch(from #9B8AFB l c h)',
  },
  intp: {
    label: 'INTP - The Thinker',
    color: 'oklch(from #9B8AFB l c h)',
  },
  entj: {
    label: 'ENTJ - The Commander',
    color: 'oklch(from #9B8AFB l c h)',
  },
  entp: {
    label: 'ENTP - The Debater',
    color: 'oklch(from #9B8AFB l c h)',
  },
  infj: {
    label: 'INFJ - The Advocate',
    color: 'oklch(from #6CE9A6 l c h)',
  },
  infp: {
    label: 'INFP - The Mediator',
    color: 'oklch(from #6CE9A6 l c h)',
  },
  enfj: {
    label: 'ENFJ - The Protagonist',
    color: 'oklch(from #6CE9A6 l c h)',
  },
  enfp: {
    label: 'ENFP - The Campaigner',
    color: 'oklch(from #6CE9A6 l c h)',
  },
  istj: {
    label: 'ISTJ - The Logistician',
    color: 'oklch(from #7CD4FD l c h)',
  },
  isfj: {
    label: 'ISFJ - The Protector',
    color: 'oklch(from #7CD4FD l c h)',
  },
  estj: {
    label: 'ESTJ - The Executive',
    color: 'oklch(from #7CD4FD l c h)',
  },
  esfj: {
    label: 'ESFJ - The Consul',
    color: 'oklch(from #7CD4FD l c h)',
  },
  istp: {
    label: 'ISTP - The Virtuoso',
    color: 'oklch(from #FEC84B l c h)',
  },
  isfp: {
    label: 'ISFP - The Adventurer',
    color: 'oklch(from #FEC84B l c h)',
  },
  estp: {
    label: 'ESTP - The Entrepreneur',
    color: 'oklch(from #FEC84B l c h)',
  },
  esfp: {
    label: 'ESFP - The Entertainer',
    color: 'oklch(from #FEC84B l c h)',
  },
} satisfies ChartConfig;

const MBTI_GROUP: Record<
  MbtiType,
  'analyst' | 'diplomat' | 'sentinel' | 'explorer'
> = {
  INTJ: 'analyst',
  INTP: 'analyst',
  ENTJ: 'analyst',
  ENTP: 'analyst',
  INFJ: 'diplomat',
  INFP: 'diplomat',
  ENFJ: 'diplomat',
  ENFP: 'diplomat',
  ISTJ: 'sentinel',
  ISFJ: 'sentinel',
  ESTJ: 'sentinel',
  ESFJ: 'sentinel',
  ISTP: 'explorer',
  ISFP: 'explorer',
  ESTP: 'explorer',
  ESFP: 'explorer',
};

type MbtiGroup = 'analyst' | 'diplomat' | 'sentinel' | 'explorer';

function getGroupForType(type: MbtiType): MbtiGroup {
  return MBTI_GROUP[type];
}

// Compute mascot position similar to pre-refactor (centered on bar, slightly overlapping top)
function getMascotXY(
  barX: number,
  barY: number,
  barW: number,
  iconW: number,
  iconH: number,
  opts?: {
    anchor?: 'left' | 'center' | 'right';
    dx?: number;
    dy?: number;
    overlap?: number;
  }
) {
  const anchor = opts?.anchor ?? 'center';
  const dx = opts?.dx ?? 0;
  const dy = opts?.dy ?? 0;
  const overlap = opts?.overlap ?? 0.3;

  let anchorX = barX + barW / 2;
  if (anchor === 'left') anchorX = barX;
  if (anchor === 'right') anchorX = barX + barW;

  const x = Math.round(anchorX - iconW / 2 + dx);
  const y = Math.max(4, Math.round(barY - iconH + iconH * overlap + dy));
  return { x, y };
}

interface MbtiBarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    kategori: string;
    jumlah: number;
  };
}

function MbtiBarShape(
  props: MbtiBarShapeProps & {
    gradientIds: Record<MbtiGroup, string>;
    faceShadowId: string;
  }
) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    payload,
    gradientIds,
    faceShadowId,
  } = props;

  if (!payload) {
    return (
      <rect x={x} y={y} width={width} height={height} fill='transparent' />
    );
  }

  const mbtiType = payload.kategori as MbtiType;
  const group = getGroupForType(mbtiType);
  const fill = `url(#${gradientIds[group]})`;
  // Icon layout (match previous sizing/tweaks)
  const MASCOT_DEFAULT = { size: 42 } as const;
  const tweaks = ICON_TWEAKS[mbtiType] ?? {};
  const size = tweaks.size ?? MASCOT_DEFAULT.size;
  const { x: iconX, y: iconY } = getMascotXY(x, y, width, size, size, tweaks);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={6}
        ry={6}
      />

      {/* Wrap in svg to apply SVG filter attribute consistently */}
      <svg
        x={iconX}
        y={iconY}
        width={size}
        height={size}
        viewBox='0 0 100 100'
        preserveAspectRatio='xMidYMid meet'
        aria-label={mbtiType}
        filter={`url(#${faceShadowId})`}
      >
        <image
          href={`/mbti-logo-normalized/${mbtiType}.svg`}
          x='0'
          y='0'
          width='100'
          height='100'
          preserveAspectRatio='xMidYMid meet'
        />
      </svg>
    </g>
  );
}

interface MbtiBarChartProps {
  stats: AssignmentStats['mbti'];
  ready: boolean;
}

export function MbtiBarChart({ stats, ready }: MbtiBarChartProps) {
  const t = useTranslations('dashboard.charts');

  const chartData = stats.map(row => ({
    kategori: row.kategori,
    jumlah: ready ? row.jumlah : 0,
  }));

  // Create unique, stable IDs for gradients and face shadow filter per chart instance
  const greenId = useId().replace(/:/g, '');
  const purpleId = useId().replace(/:/g, '');
  const blueId = useId().replace(/:/g, '');
  const amberId = useId().replace(/:/g, '');
  const faceShadowId = useId().replace(/:/g, '');

  const gradientIds: Record<MbtiGroup, string> = {
    analyst: `mbti-purple-${purpleId}`,
    diplomat: `mbti-green-${greenId}`,
    sentinel: `mbti-blue-${blueId}`,
    explorer: `mbti-amber-${amberId}`,
  };

  const MBTI_LEGEND = [
    { color: 'bg-violet-500', label: t('analyst'), group: 'analyst' as const },
    {
      color: 'bg-emerald-500',
      label: t('diplomat'),
      group: 'diplomat' as const,
    },
    { color: 'bg-sky-500', label: t('sentinel'), group: 'sentinel' as const },
    { color: 'bg-amber-500', label: t('explorer'), group: 'explorer' as const },
  ];

  return (
    <>
      <ChartContainer
        config={chartConfig}
        className='h-[180px] w-full max-w-[900px] mb-3 justify-start'
      >
        <BarChart
          data={chartData}
          margin={{ bottom: 20, left: 0, right: 8, top: 16 }}
          barCategoryGap={8}
        >
          <defs>
            <filter
              id={faceShadowId}
              x='-50%'
              y='-50%'
              width='200%'
              height='200%'
            >
              <feDropShadow dx='0' dy='2' stdDeviation='4' floodOpacity='0.2' />
            </filter>
            <linearGradient
              id={gradientIds.diplomat}
              x1='0'
              y1='0'
              x2='0'
              y2='1'
            >
              <stop offset='0%' stopColor='oklch(from #6CE9A6 l c h)' />
              <stop offset='100%' stopColor='oklch(from #3BCC7E l c h)' />
            </linearGradient>
            <linearGradient
              id={gradientIds.analyst}
              x1='0'
              y1='0'
              x2='0'
              y2='1'
            >
              <stop offset='0%' stopColor='oklch(from #9B8AFB l c h)' />
              <stop offset='100%' stopColor='oklch(from #7A64FA l c h)' />
            </linearGradient>
            <linearGradient
              id={gradientIds.sentinel}
              x1='0'
              y1='0'
              x2='0'
              y2='1'
            >
              <stop offset='0%' stopColor='oklch(from #7CD4FD l c h)' />
              <stop offset='100%' stopColor='oklch(from #38B8F4 l c h)' />
            </linearGradient>
            <linearGradient
              id={gradientIds.explorer}
              x1='0'
              y1='0'
              x2='0'
              y2='1'
            >
              <stop offset='0%' stopColor='oklch(from #FEC84B l c h)' />
              <stop offset='100%' stopColor='oklch(from #D7A32A l c h)' />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey='kategori'
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={value => value.slice(0, 10)}
            label={{
              value: t('personalityType'),
              position: 'insideBottom',
              offset: -10,
              style: { textAnchor: 'middle' },
            }}
          />
          <YAxis tickLine={false} axisLine={false} width={28} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className='w-[220px]'
                nameKey='jumlah'
                labelFormatter={value => `Kategori: ${value}`}
                formatter={(
                  val,
                  _name: string | number,
                  item: { payload?: { kategori?: string } }
                ) => {
                  const key = item?.payload?.kategori;
                  return (
                    <div className='flex items-center gap-2'>
                      {key ? (
                        <Image
                          src={`/mbti-logo-normalized/${key}.svg`}
                          alt={String(key)}
                          width={24}
                          height={24}
                        />
                      ) : null}
                      <span className='text-foreground font-mono font-medium tabular-nums'>
                        {Number(val).toLocaleString()}
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Bar
            dataKey='jumlah'
            shape={(props: MbtiBarShapeProps) => (
              <MbtiBarShape
                x={props.x}
                y={props.y}
                width={props.width}
                height={props.height}
                payload={props.payload}
                gradientIds={gradientIds}
                faceShadowId={faceShadowId}
              />
            )}
          />
        </BarChart>
      </ChartContainer>

      <div className='flex justify-center items-center gap-4 mt-4'>
        {MBTI_LEGEND.map(({ color, label, group }) => (
          <div key={group} className='flex items-center gap-1.5'>
            <div
              className={`w-2.5 h-2.5 rounded-full ${color}`}
              aria-hidden='true'
            />
            <span className='text-xs text-gray-600'>{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
