"use client";

import { BarChart3, ChevronDown, ChevronUp, Dot, Sigma } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TeamQualityMetrics } from "@/lib/stats/assignment";

interface TeamQualitySummaryProps {
  metrics: TeamQualityMetrics;
}

export function TeamQualitySummary({ metrics }: TeamQualitySummaryProps) {
  const t = useTranslations("dashboard.assignment.charts");

  const formatPercent = (value: number) => {
    const pct = Math.round(value * 100);
    return `${pct}%`;
  };

  return (
    <div className="flex flex-col gap-3 mb-4">
      <h2 className="text-neutral-800 font-medium text-base">{t("qualityDistributionTitle")}:</h2>
      <div className="flex gap-6">
        <div className="flex flex-col items-start gap-2 bg-white rounded-xl shadow-sm p-6 flex-1">
          <div className="flex items-center gap-1.5 text-red-600 text-base font-medium">
            <span>{t("min")}</span>
            <ChevronDown size={20} />
          </div>
          <h1 className="text-4xl font-semibold text-red-600">{formatPercent(metrics.min)}</h1>
        </div>

        <div className="flex flex-col items-start gap-2 bg-white rounded-xl shadow-sm p-6 flex-1">
          <div className="flex items-center gap-1.5 text-green-600 text-base font-medium">
            <span>{t("max")}</span>
            <ChevronUp size={20} />
          </div>
          <h1 className="text-4xl font-semibold text-green-600">{formatPercent(metrics.max)}</h1>
        </div>

        <div className="flex flex-col items-start gap-2 bg-white rounded-xl shadow-sm p-6 flex-1">
          <div className="flex items-center gap-1.5 text-orange-600 text-base font-medium">
            <span>{t("mean")}</span>
            <Dot size={20} />
          </div>
          <h1 className="text-4xl font-semibold text-orange-600">{formatPercent(metrics.mean)}</h1>
        </div>

        <div className="flex flex-col items-start gap-2 bg-white rounded-xl shadow-sm p-6 flex-1">
          <div className="flex items-center gap-1.5 text-blue-600 text-base font-medium">
            <span>{t("median")}</span>
            <BarChart3 size={20} />
          </div>
          <h1 className="text-4xl font-semibold text-blue-600">{formatPercent(metrics.median)}</h1>
        </div>

        <div className="flex flex-col items-start gap-2 bg-white rounded-xl shadow-sm p-6 flex-1">
          <div className="flex items-center gap-1.5 text-[#808000] text-base font-medium">
            <span>{t("stdDev")}</span>
            <Sigma size={20} />
          </div>
          <h1 className="text-4xl font-semibold text-[#808000]">{formatPercent(metrics.stdDev)}</h1>
        </div>
      </div>
    </div>
  );
}
