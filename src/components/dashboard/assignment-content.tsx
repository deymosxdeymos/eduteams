'use client';

import { ArrowLeft, ChartLineIcon, Plus } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useId, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie as RePie,
  PieChart as RePieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { AssignmentStats } from '@/lib/stats/assignment';

// ——————————————————————————————————————————————————————————————————————————
// MBTI Chart helpers
// ——————————————————————————————————————————————————————————————————————————

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

type ChartRow = { kategori: MbtiType; jumlah: number; fill: string };

// Group mapping just to keep gradient intent clear and editable in one place.
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

function useGradientIds() {
  const green = useId();
  const purple = useId();
  const blue = useId();
  const amber = useId();

  const urlFor = (type: MbtiType) => {
    const group = MBTI_GROUP[type];
    if (group === 'analyst') return `url(#${purple})`;
    if (group === 'diplomat') return `url(#${green})`;
    if (group === 'sentinel') return `url(#${blue})`;
    return `url(#${amber})`;
  };

  return { ids: { green, purple, blue, amber }, urlFor };
}

// Build MBTI chart rows from stats
function useMbtiChartData(
  stats: AssignmentStats,
  urlFor: (t: MbtiType) => string
) {
  return useMemo<ChartRow[]>(() => {
    return stats.mbti.map(row => ({
      kategori: row.kategori as MbtiType,
      jumlah: stats.teamsFormed ? row.jumlah : 0,
      fill: urlFor(row.kategori as MbtiType),
    }));
  }, [stats, urlFor]);
}

const chartConfig = {
  jumlah: {
    label: 'Jumlah Mahasiswa',
  },
  intj: {
    label: 'INTJ - The Architect',
    color: '#9B8AFB',
  },
  intp: {
    label: 'INTP - The Thinker',
    color: '#9B8AFB',
  },
  entj: {
    label: 'ENTJ - The Commander',
    color: '#9B8AFB',
  },
  entp: {
    label: 'ENTP - The Debater',
    color: '#9B8AFB',
  },
  infj: {
    label: 'INFJ - The Advocate',
    color: '#6CE9A6',
  },
  infp: {
    label: 'INFP - The Mediator',
    color: '#6CE9A6',
  },
  enfj: {
    label: 'ENFJ - The Protagonist',
    color: '#6CE9A6',
  },
  enfp: {
    label: 'ENFP - The Campaigner',
    color: '#6CE9A6',
  },
  istj: {
    label: 'ISTJ - The Logistician',
    color: '#7CD4FD',
  },
  isfj: {
    label: 'ISFJ - The Protector',
    color: '#7CD4FD',
  },
  estj: {
    label: 'ESTJ - The Executive',
    color: '#7CD4FD',
  },
  esfj: {
    label: 'ESFJ - The Consul',
    color: '#7CD4FD',
  },
  istp: {
    label: 'ISTP - The Virtuoso',
    color: '#FEC84B',
  },
  isfp: {
    label: 'ISFP - The Adventurer',
    color: '#FEC84B',
  },
  estp: {
    label: 'ESTP - The Entrepreneur',
    color: '#FEC84B',
  },
  esfp: {
    label: 'ESFP - The Entertainer',
    color: '#FEC84B',
  },
} satisfies ChartConfig;

// ——————————————————————————————————————————————————————————————————————————
// Mascot layout controls (simple, centralized, consistent)
// ——————————————————————————————————————————————————————————————————————————

// Global baseline
const MASCOT_DEFAULT = { size: 42, offsetX: 0, offsetY: 0 } as const; // px

// Per-type last-mile tweaks (only touch when needed)
// Example: to lower ENFP by 2px: ENFP: { offsetY: 2 }
const MASCOT_TWEAKS: Partial<
  Record<MbtiType, { size?: number; offsetX?: number; offsetY?: number }>
> = {
  // Keep defaults uniform; add per-type entries if you see visual outliers
  ESTP: { size: 52, offsetX: -2, offsetY: 1 },
  INTP: { offsetX: -3 },
  ENTJ: { offsetX: 1 },
  INFJ: { offsetX: 2 },
  ESFJ: { size: 48 },
  INFP: { size: 38, offsetY: 1 },
  ENFJ: { size: 48, offsetX: -4, offsetY: 2 },
  ENFP: { offsetX: -2, offsetY: 2 },
};

function getMascotLayout(type: MbtiType) {
  const t = MASCOT_TWEAKS[type] ?? {};
  const size = t.size ?? MASCOT_DEFAULT.size;
  return {
    width: size,
    height: size,
    offsetX: (t.offsetX ?? 0) + MASCOT_DEFAULT.offsetX,
    offsetY: (t.offsetY ?? 0) + MASCOT_DEFAULT.offsetY,
  };
}

function getMascotXY({
  barX,
  barY,
  barW,
  iconW,
  iconH,
  offsetX,
  offsetY,
}: {
  barX: number;
  barY: number;
  barW: number;
  iconW: number;
  iconH: number;
  offsetX: number;
  offsetY: number;
}) {
  const centerX = barX + barW / 2;
  const overlap = Math.floor(iconH * 0.3); // slightly overlaps into bar head
  const x = centerX - iconW / 2 + offsetX;
  const y = Math.max(4, barY - iconH + overlap) + offsetY;
  return { x, y };
}

const MASCOT_SRC_BASE = '/mbti-logo-normalized';

type RechartsBarShapeInput = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { kategori?: MbtiType; fill?: string };
};

type BarShapeProps = RechartsBarShapeInput & {
  faceShadowId: string;
};

function MbtiBarShape({
  x,
  y,
  width,
  height,
  payload,
  faceShadowId,
}: BarShapeProps) {
  const rw = width ?? 0;
  const rh = height ?? 0;
  const rx = 6;
  const type = (payload?.kategori ?? 'INTJ') as MbtiType;
  const {
    width: iconW,
    height: iconH,
    offsetX,
    offsetY,
  } = getMascotLayout(type);
  const { x: iconX, y: iconY } = getMascotXY({
    barX: x ?? 0,
    barY: y ?? 0,
    barW: rw,
    iconW,
    iconH,
    offsetX,
    offsetY,
  });
  const fill = payload?.fill ?? '#999';

  return (
    <g>
      <rect x={x} y={y} width={rw} height={rh} rx={rx} fill={fill} />
      <svg
        x={iconX}
        y={iconY}
        width={iconW}
        height={iconH}
        viewBox='0 0 100 100'
        preserveAspectRatio='xMidYMid meet'
        aria-label={type}
        filter={`url(#${faceShadowId})`}
      >
        <image
          href={`${MASCOT_SRC_BASE}/${type}.svg`}
          x='0'
          y='0'
          width='100'
          height='100'
          preserveAspectRatio='xMidYMin meet'
        />
      </svg>
    </g>
  );
}

interface AssignmentContentProps {
  assignmentId: string;
  classId: string;
  canManage: boolean;
  isStudent?: boolean;
  hasSubmitted?: boolean;
  stats: AssignmentStats;
}

export function AssignmentContent({
  assignmentId,
  classId,
  canManage,
  isStudent = false,
  stats,
}: AssignmentContentProps) {
  const router = useRouter();
  const { ids: gradientIds, urlFor } = useGradientIds();
  const faceShadowId = useId();
  const chartData = useMbtiChartData(stats, urlFor);

  // Dynamic topics and gender chart setup
  const topicConfig = useMemo(() => {
    // generate a small palette
    const colors = [
      '#4F46E5',
      '#6366F1',
      '#A5B4FC',
      '#C7D2FE',
      '#818CF8',
      '#60A5FA',
    ];
    const entries = stats.topicPreferences.map((t, i) => {
      const key = slugify(t.name);
      return [
        key,
        { label: t.name, color: colors[i % colors.length] } as const,
      ];
    });
    return Object.fromEntries(entries);
  }, [stats.topicPreferences]);

  const topicData = useMemo(() => {
    const n = stats.topicPreferences.length || 1;
    const placeholder = Math.round(100 / n);
    return stats.topicPreferences.map(t => ({
      name: slugify(t.name),
      value: stats.teamsFormed ? t.value : placeholder,
      fill: `var(--color-${slugify(t.name)})`,
    }));
  }, [stats]);

  const genderConfig = useMemo(
    () => ({
      laki: { label: 'Laki-laki', color: '#3B82F6' },
      perempuan: { label: 'Perempuan', color: '#EC4899' },
    }),
    []
  );

  const genderData = useMemo(() => {
    const placeholder = 50;
    return stats.gender.map(g => ({
      name: g.name,
      value: stats.teamsFormed ? g.value : placeholder,
      fill: `var(--color-${g.name})`,
    }));
  }, [stats]);

  return (
    <div className='flex-1 p-8 min-h-0'>
      <div className='h-full flex flex-col space-y-4 text-gray-500'>
        <div className='flex items-center gap-4 flex-shrink-0'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => window.history.back()}
            className='rounded-full'
          >
            <ArrowLeft strokeWidth={2} className='w-6 h-6 text-gray-600' />
          </Button>
          {canManage && (
            <Button variant='onboarding' className='rounded-full p-6 w-[11rem]'>
              <Plus strokeWidth={3} className='w-4 h-4 text-white' />
              <span className='font-semibold text-sm'>Buat Kelompok</span>
            </Button>
          )}
          {!isStudent && (
            <Button
              variant='outline'
              className='rounded-full border border-black p-6 w-[15rem]'
            >
              <ChartLineIcon className='w-4 h-4 text-black' />
              <span className='text-black font-semibold text-sm'>
                Lihat Jawaban Mahasiswa
              </span>
            </Button>
          )}
          {isStudent && (
            <Button
              variant='outline'
              className='rounded-full border border-black p-6 w-[14rem]'
              onClick={() =>
                router.push(
                  `/dashboard/class/${classId}/assignments/${assignmentId}/quiz`
                )
              }
            >
              <ChartLineIcon className='w-4 h-4 text-black' />
              <span className='text-black font-semibold text-sm'>
                Lihat Jawaban Saya
              </span>
            </Button>
          )}
        </div>
        {isStudent ? (
          <div className='flex-1 flex items-center justify-center'>
            <div className='flex flex-col items-center text-center max-w-xl'>
              <Image
                src='/waiting-form.svg'
                alt='Menunggu pembagian kelompok'
                width={120}
                height={120}
                className='mb-6'
                priority
              />
              <h1 className='text-2xl font-bold text-gray-800 mb-2'>
                Menunggu pembagian kelompok!
              </h1>
              <p className='text-gray-600'>
                Tenang, datamu sudah terekam dengan baik. Tunggu sebentar ya,
                dosen sedang memproses pembagian kelompok.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className='flex flex-col justify-start border shadow-sm rounded-xl p-4 flex-shrink-0'>
              <div className='mb-2'>
                <span className='text-neutral-500 font-light text-base block'>
                  Grafik Persebaran
                </span>
                <h1 className='text-neutral-800 font-medium text-xl'>
                  Personality Mahasiswa
                </h1>
              </div>
              <div className='overflow-x-auto'>
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
                        x='-20%'
                        y='-20%'
                        width='140%'
                        height='140%'
                      >
                        <feDropShadow
                          dx='0'
                          dy='1'
                          stdDeviation='1.2'
                          floodOpacity='0.35'
                        />
                      </filter>
                      <linearGradient
                        id={gradientIds.green}
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop offset='0%' stopColor='#6CE9A6' />
                        <stop offset='100%' stopColor='#3BCC7E' />
                      </linearGradient>
                      <linearGradient
                        id={gradientIds.purple}
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop offset='0%' stopColor='#9B8AFB' />
                        <stop offset='100%' stopColor='#7A64FA' />
                      </linearGradient>
                      <linearGradient
                        id={gradientIds.blue}
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop offset='0%' stopColor='#7CD4FD' />
                        <stop offset='100%' stopColor='#38B8F4' />
                      </linearGradient>
                      <linearGradient
                        id={gradientIds.amber}
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop offset='0%' stopColor='#FEC84B' />
                        <stop offset='100%' stopColor='#D7A32A' />
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
                        value: 'Tipe Personality',
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
                                    src={`${MASCOT_SRC_BASE}/${key}.svg`}
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
                      shape={(props: RechartsBarShapeInput) => (
                        <MbtiBarShape
                          x={props.x}
                          y={props.y}
                          width={props.width}
                          height={props.height}
                          payload={props.payload}
                          faceShadowId={faceShadowId}
                        />
                      )}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <div className='flex gap-x-4 flex-1 min-h-0'>
              <div className='flex flex-col border shadow-sm rounded-xl p-4 flex-1 min-h-0'>
                <div className='flex-shrink-0 mb-3'>
                  <span className='text-neutral-500 font-light text-base block'>
                    Grafik Rata-Rata
                  </span>
                  <h1 className='text-neutral-800 font-medium text-xl'>
                    Keahlian Mahasiswa
                  </h1>
                </div>
                <div className='flex flex-col gap-3 flex-1 justify-center'>
                  {(stats.skills.length > 0 ? stats.skills : []).map((s, i) => (
                    <div className='flex items-center gap-8 w-full' key={i}>
                      <div
                        className='text-neutral-700 text-sm flex-shrink-0'
                        style={{ width: '80px', whiteSpace: 'pre-wrap' }}
                      >
                        {(s.label || '').replace(/\s+/g, '\n')}
                      </div>
                      <div className='flex-1 h-3 rounded-full bg-neutral-200'>
                        <div
                          className='h-3 rounded-full bg-[#235ADF]'
                          style={{
                            width: `${stats.teamsFormed ? s.value : 0}%`,
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

              <div className='flex flex-col border shadow-sm rounded-xl p-4 flex-1 min-h-0'>
                <div className='flex-shrink-0 mb-3'>
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
                      config={topicConfig}
                      className='w-full aspect-square max-h-[200px]'
                    >
                      <RePieChart>
                        <ChartTooltip
                          content={<ChartTooltipContent hideIndicator />}
                        />
                        <RePie
                          dataKey='value'
                          nameKey='name'
                          data={topicData}
                          cx='50%'
                          cy='50%'
                          innerRadius={0}
                          outerRadius='80%'
                          paddingAngle={0}
                          stroke='none'
                          strokeWidth={0}
                        />
                      </RePieChart>
                    </ChartContainer>
                  </div>
                  <div className='flex flex-wrap gap-x-6 gap-y-1 text-sm flex-shrink-0'>
                    {stats.topicPreferences.map((t, i) => {
                      const key = slugify(t.name);
                      const colors = [
                        '#4F46E5',
                        '#6366F1',
                        '#A5B4FC',
                        '#C7D2FE',
                        '#818CF8',
                        '#60A5FA',
                      ];
                      return (
                        <div
                          key={`${key}-${i}`}
                          className='flex items-center gap-1.5'
                        >
                          <span
                            className='inline-block h-3 w-3 rounded-full'
                            style={{
                              backgroundColor: colors[i % colors.length],
                            }}
                          />
                          <span className='text-neutral-800'>{t.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className='flex flex-col border shadow-sm rounded-xl p-4 flex-1 min-h-0'>
                <div className='flex-shrink-0 mb-3'>
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
                      config={genderConfig}
                      className='w-full aspect-square max-h-[200px]'
                    >
                      <RePieChart>
                        <ChartTooltip
                          content={<ChartTooltipContent hideIndicator />}
                        />
                        <RePie
                          dataKey='value'
                          nameKey='name'
                          data={genderData}
                          cx='50%'
                          cy='50%'
                          innerRadius='40%'
                          outerRadius='80%'
                          paddingAngle={0}
                          stroke='none'
                          strokeWidth={0}
                        />
                      </RePieChart>
                    </ChartContainer>
                  </div>
                  <div className='flex flex-wrap gap-x-6 gap-y-1 text-sm flex-shrink-0 justify-center'>
                    <div className='flex items-center gap-1.5'>
                      <span
                        className='inline-block h-3 w-3 rounded-full'
                        style={{ backgroundColor: '#3B82F6' }}
                      />
                      <span className='text-neutral-800'>Laki-laki</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <span
                        className='inline-block h-3 w-3 rounded-full'
                        style={{ backgroundColor: '#EC4899' }}
                      />
                      <span className='text-neutral-800'>Perempuan</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 30);
}
