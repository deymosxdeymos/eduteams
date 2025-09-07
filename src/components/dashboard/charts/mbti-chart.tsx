'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

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

interface MbtiData {
  kategori: MbtiType;
  jumlah: number;
}

interface MbtiChartProps {
  data: MbtiData[];
  teamsFormed: boolean;
  className?: string;
}

const MBTI_GROUP_COLORS: Record<
  'analyst' | 'diplomat' | 'sentinel' | 'explorer',
  string
> = {
  analyst: 'hsl(var(--chart-1))',
  diplomat: 'hsl(var(--chart-2))',
  sentinel: 'hsl(var(--chart-3))',
  explorer: 'hsl(var(--chart-4))',
};

const MBTI_GROUPS: Record<
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

const MBTI_LABELS: Record<MbtiType, string> = {
  INTJ: 'The Architect',
  INTP: 'The Thinker',
  ENTJ: 'The Commander',
  ENTP: 'The Debater',
  INFJ: 'The Advocate',
  INFP: 'The Mediator',
  ENFJ: 'The Protagonist',
  ENFP: 'The Campaigner',
  ISTJ: 'The Logistician',
  ISFJ: 'The Protector',
  ESTJ: 'The Executive',
  ESFJ: 'The Consul',
  ISTP: 'The Virtuoso',
  ISFP: 'The Adventurer',
  ESTP: 'The Entrepreneur',
  ESFP: 'The Entertainer',
};

export function MbtiChart({ data, teamsFormed, className }: MbtiChartProps) {
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      jumlah: { label: 'Jumlah Mahasiswa' },
    };

    data.forEach(item => {
      const group = MBTI_GROUPS[item.kategori];
      config[item.kategori.toLowerCase()] = {
        label: `${item.kategori} - ${MBTI_LABELS[item.kategori]}`,
        color: MBTI_GROUP_COLORS[group],
      };
    });

    return config;
  }, [data]);

  const chartData = useMemo(() => {
    return data.map(item => ({
      kategori: item.kategori,
      jumlah: teamsFormed ? item.jumlah : 0,
      fill: `var(--color-${item.kategori.toLowerCase()})`,
    }));
  }, [data, teamsFormed]);

  return (
    <div className={className}>
      <div className='mb-2'>
        <span className='text-neutral-500 font-light text-base block'>
          Grafik Persebaran
        </span>
        <h1 className='text-neutral-800 font-medium text-xl'>
          Personality Mahasiswa
        </h1>
      </div>

      <div className='relative'>
        <ChartContainer config={chartConfig} className='h-[200px] w-full'>
          <BarChart
            data={chartData}
            margin={{ bottom: 20, left: 0, right: 8, top: 16 }}
            barCategoryGap={8}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='kategori'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={value => value}
            />
            <YAxis tickLine={false} axisLine={false} width={28} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className='w-[220px]'
                  nameKey='jumlah'
                  labelFormatter={value => `Kategori: ${value}`}
                  formatter={(val, _name, item) => {
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
            <Bar dataKey='jumlah' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>

        <ChartLegend className='mt-4'>
          <ChartLegendContent />
        </ChartLegend>
      </div>
    </div>
  );
}
