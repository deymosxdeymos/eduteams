"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";

interface ClassCardProps {
  id: string;
  title: string;
  academicYear: string;
  studentCount: number;
  classCode: string;
}

const getClassBadgeColor = (classCode: string) => {
  const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
    RA: { bg: "bg-violet-100", text: "text-violet-800", dot: "bg-violet-800" },
    RB: { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-800" },
    RC: { bg: "bg-pink-100", text: "text-pink-800", dot: "bg-pink-800" },
    RD: { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-800" },
    RE: { bg: "bg-lime-100", text: "text-lime-800", dot: "bg-lime-800" },
    "tanpa-kelas": {
      bg: "bg-gray-50",
      text: "text-gray-900",
      dot: "bg-gray-900",
    },
  };

  return (
    colorMap[classCode] || {
      bg: "bg-gray-50",
      text: "text-gray-900",
      dot: "bg-gray-900",
    }
  );
};

export const ClassCard = memo(function ClassCard({
  id,
  title,
  academicYear,
  studentCount,
  classCode,
}: ClassCardProps) {
  const t = useTranslations("dashboard.classCard");
  const badgeColors = getClassBadgeColor(classCode);

  return (
    <Link
      href={`/dashboard/class/${id}`}
      className="group flex h-full w-full cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:opacity-95 md:px-5 md:py-4"
    >
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-wrap gap-2">
            {classCode !== "tanpa-kelas" && (
              <Badge
                variant="destructive"
                className={`${badgeColors.bg} ${badgeColors.text} text-xs font-medium`}
              >
                <div className={`h-2 w-2 rounded-full ${badgeColors.dot}`}></div> {classCode}
              </Badge>
            )}
            <Badge
              variant="default"
              className="rounded-2xl bg-sky-50 text-xs font-medium text-sky-900"
            >
              {t("studentCount", { count: studentCount })}
            </Badge>
          </div>
        </div>
        <h3 className="min-h-[3.6rem] text-[1.35rem] font-semibold leading-tight text-gray-800 line-clamp-2 md:min-h-[3.75rem] md:text-[1.65rem]">
          {title}
        </h3>
        <div className="mt-auto pt-1">
          <p className="text-xs font-medium tracking-wide text-gray-500 md:text-sm md:tracking-normal">
            {academicYear}
          </p>
        </div>
      </div>
    </Link>
  );
});
