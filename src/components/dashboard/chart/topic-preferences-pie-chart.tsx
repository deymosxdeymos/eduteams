import { Pie as RePie, PieChart as RePieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { AssignmentStats } from "@/lib/stats/assignment";

interface TopicPreferencesPieChartProps {
  topicPreferences: AssignmentStats["topicPreferences"];
  ready: boolean;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 30);
}

export function TopicPreferencesPieChart({
  topicPreferences,
  ready,
}: TopicPreferencesPieChartProps) {
  // Match pre-refactor palette (bluish scale) using OKLCH
  const colors = [
    "oklch(from #4F46E5 l c h)",
    "oklch(from #6366F1 l c h)",
    "oklch(from #A5B4FC l c h)",
    "oklch(from #C7D2FE l c h)",
    "oklch(from #E0E7FF l c h)",
  ];
  const entries = topicPreferences.map((t, i) => {
    const key = slugify(t.name);
    return [key, { label: t.name, color: colors[i % colors.length] } as const];
  });
  const config = Object.fromEntries(entries);

  const n = topicPreferences.length || 1;
  const placeholder = Math.round(100 / n);
  const chartData = topicPreferences.map((t, i) => ({
    name: slugify(t.name),
    value: ready ? t.value : placeholder,
    fill: colors[i % colors.length],
  }));

  return (
    <div className="flex flex-col flex-1 justify-center">
      <div className="flex-1 flex items-center justify-center">
        <ChartContainer config={config} className="w-full aspect-square max-h-[200px]">
          <RePieChart>
            <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
            <RePie
              dataKey="value"
              nameKey="name"
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius="80%"
              paddingAngle={0}
              stroke="none"
              strokeWidth={0}
            />
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </RePieChart>
        </ChartContainer>
      </div>
    </div>
  );
}
