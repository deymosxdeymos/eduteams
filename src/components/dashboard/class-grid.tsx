"use client";

import { useTranslations } from "next-intl";
import { ClassCard } from "./class-card";

export interface ClassSummary {
  id: string;
  title: string;
  academicYear: string;
  studentCount: number;
  classCode: string;
}

interface ClassGridProps {
  classes: ClassSummary[];
  showNoResults?: boolean;
}

export function ClassGrid({ classes = [], showNoResults = false }: ClassGridProps) {
  const t = useTranslations("dashboard.classGrid");

  // Show "no results" message if search returned empty and we're in search mode
  if (showNoResults) {
    return (
      <div className="h-full flex items-center justify-center pt-4 pb-6">
        <div className="text-center">
          <p className="text-gray-500 text-lg font-medium">{t("noResults")}</p>
          <p className="text-gray-400 text-sm mt-2">{t("tryOtherKeyword")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col pt-4 pb-6">
      <div
        className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-3"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e1 transparent",
        }}
      >
        {classes.map((classItem) => (
          <div key={classItem.id} className="content-auto">
            <ClassCard
              id={classItem.id}
              title={classItem.title}
              academicYear={classItem.academicYear}
              studentCount={classItem.studentCount}
              classCode={classItem.classCode}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
