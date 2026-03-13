"use client";

import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MissingStudent {
  id: string;
  name: string | null;
  nim: string | null;
  email: string | null;
  mbtiType: string | null;
}

interface ChartsToggleProps {
  progressPercent: number; // 0..100
  children: React.ReactNode;
  defaultVisible?: boolean;
  hideToggle?: boolean;
  incompleteStudentCount?: number;
  hasTeams?: boolean;
  missingStudents?: MissingStudent[];
}

export function ChartsToggle({
  progressPercent,
  children,
  defaultVisible = true,
  hideToggle = false,
  incompleteStudentCount = 0,
  hasTeams = false,
  missingStudents = [],
}: ChartsToggleProps) {
  const t = useTranslations("dashboard.charts");
  const [visible, setVisible] = useState(defaultVisible);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const onKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setVisible((v) => !v);
    }
  }, []);
  if (hideToggle) {
    return null;
  }

  const showMissingStudentsBadge = hasTeams && incompleteStudentCount > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setVisible((v) => !v)}
          onKeyDown={onKey}
          className="inline-flex items-center gap-2 text-black select-none cursor-pointer"
          aria-expanded={visible}
        >
          <span className="font-medium">{t("viewAnalysis")}</span>
          {visible ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
        {showMissingStudentsBadge ? (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Badge
                variant="destructive"
                className="text-md rounded-full bg-red-50 text-red-700 border-transparent cursor-pointer hover:bg-red-100 transition-colors"
              >
                <AlertCircle className="w-3 h-3" />
                {t("missingStudents", { count: incompleteStudentCount })}
              </Badge>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1">
                  <AlertCircle className="w-4 h-4 text-red-700" />
                  <p className="text-sm font-medium">
                    {t("missingStudents", { count: incompleteStudentCount })}
                  </p>
                </div>
                {missingStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 px-2 py-2">
                    No student information available
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {missingStudents.map((student) => (
                      <div
                        key={student.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-red-50 border border-red-200"
                      >
                        {student.mbtiType ? (
                          <Image
                            src={`/mbti-logo-normalized/${student.mbtiType}.svg`}
                            alt={student.mbtiType}
                            width={32}
                            height={32}
                            className="w-8 h-8"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-xs">
                              {(student.name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-red-900">
                            {student.name || "No name"}
                          </p>
                          <p className="text-xs truncate text-red-700">{student.nim || ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Badge className="text-md rounded-full bg-emerald-50 text-emerald-700">
            {t("completionRate", { percent: Math.round(progressPercent) })}
          </Badge>
        )}
      </div>
      {visible && children}
    </div>
  );
}
