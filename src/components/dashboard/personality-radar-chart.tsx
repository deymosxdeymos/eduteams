import type { TooltipProps } from "recharts";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { ColorScheme } from "@/lib/utils/mbti-colors";
import type { RadarDatum } from "@/lib/utils/mbti-dimension";

interface PersonalityRadarChartProps {
  data: RadarDatum[];
  colorScheme: ColorScheme;
  maxWidth?: number;
}

function CustomTooltipContent({
  active,
  payload,
  colorScheme,
}: TooltipProps<number, string> & { colorScheme: ColorScheme }) {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0].payload as RadarDatum;
  const traitName = data.traitLabel.replace(/\s*\([A-Z]\)/, "");
  const score = Math.round(data.score);

  return (
    <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="grid gap-1.5">
        <div className="flex w-full flex-wrap items-stretch gap-2">
          <div
            className="w-1 shrink-0 rounded-[2px]"
            style={{
              backgroundColor: colorScheme.chartColor,
            }}
          />
          <div className="flex flex-1 justify-between leading-none items-center">
            <span className="text-muted-foreground">{traitName}</span>
            <span className="text-foreground font-mono font-medium tabular-nums">{score}</span>
          </div>
        </div>
      </div>
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
      label: "Score",
      color: colorScheme.chartColor,
    },
  };

  return (
    <ChartContainer
      config={radarConfig}
      className="mx-auto aspect-square w-full"
      style={{ maxWidth: `${maxWidth}px` }}
      aria-label="Personality dimensions radar chart"
    >
      <RadarChart data={data} startAngle={90} endAngle={-270}>
        <ChartTooltip cursor={false} content={<CustomTooltipContent colorScheme={colorScheme} />} />
        <PolarGrid
          className="opacity-20"
          gridType="circle"
          radialLines={false}
          style={{ fill: "var(--color-score)" }}
        />
        <PolarAngleAxis
          dataKey="axis"
          tickLine={false}
          axisLine={false}
          tick={{ fontWeight: 600 }}
        />
        <Radar
          dataKey="score"
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
