"use client";

import { ArrowLeft, Calendar, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import { fetcher } from "@/lib/client-api";
import { formatIdTimeDate } from "@/lib/constants";
import { parseAssignmentDescription } from "@/lib/assignment-description";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import type { AssignmentClient } from "@/lib/validation/assignments";
import { EmptyStudentAssignmentState } from "./empty-student-assignment-state";
import { SearchInput } from "./search-input";

interface StudentClassAssignmentsProps {
  classId: string;
  initialAssignments?: AssignmentClient[];
  studentCount?: number;
}

export function StudentClassAssignments({
  classId,
  initialAssignments,
  studentCount = 0,
}: StudentClassAssignmentsProps) {
  const t = useTranslations("dashboard.assignments.list");
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const hasInitialAssignments = initialAssignments !== undefined;
  const { data: assignmentsData, mutate: mutateAssignments } = useSWR(
    `/api/courses/${classId}/assignments`,
    fetcher<{ data: AssignmentClient[] }>,
    {
      fallbackData: initialAssignments ? { data: initialAssignments } : undefined,
      revalidateOnMount: !hasInitialAssignments,
      revalidateIfStale: !hasInitialAssignments,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );
  const assignments = useMemo(
    () => assignmentsData?.data ?? initialAssignments ?? [],
    [assignmentsData?.data, initialAssignments],
  );
  const hasAssignments = assignments.length > 0;

  const filteredAssignments = useFuzzySearch<AssignmentClient>({
    data: assignments,
    searchTerm,
    keys: ["title"],
    debounceDelay: 250,
  });

  return (
    <div className="bg-white rounded-3xl rounded-r-none h-full flex flex-col overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/dashboard" prefetch>
              <ArrowLeft strokeWidth={2} className="w-5 h-5 text-gray-600" />
            </Link>
          </Button>

          <span className="text-gray-600 font-medium">{t("back")}</span>

          {hasAssignments && (
            <SearchInput
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder={t("search")}
              ariaLabel={t("search")}
              showClassActions={false}
              containerClassName="ml-auto w-80"
              className="pr-10"
            />
          )}
        </div>
      </div>

      {/* Assignments section */}
      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {hasAssignments ? (
            <div className="h-full overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 pr-2">
                {searchTerm.trim() !== "" && filteredAssignments.length === 0 ? (
                  <div className="text-sm text-neutral-500 px-1 py-2">
                    {t("noMatch", { query: searchTerm })}
                  </div>
                ) : null}
                {filteredAssignments.map((a) => {
                  const descriptionText = parseAssignmentDescription(a.description).text;
                  const assignmentHref =
                    !a.submittedByMe && a.status !== "BERHASIL_PEMBAGIAN_GRUP"
                      ? `/dashboard/class/${classId}/assignments/${a.id}/quiz`
                      : `/dashboard/class/${classId}/assignments/${a.id}`;
                  return (
                    <div key={a.id} className="content-auto">
                      <div
                        className="border rounded-2xl p-4 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(assignmentHref)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(assignmentHref);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {(() => {
                            const safeTotalStudents = Math.max(0, studentCount);
                            const safeSubmittedCount = Math.max(0, a.submissionsCount);
                            const clampedSubmittedCount =
                              safeTotalStudents > 0
                                ? Math.min(safeSubmittedCount, safeTotalStudents)
                                : safeSubmittedCount;
                            const allStudentsSubmitted =
                              safeTotalStudents > 0 && clampedSubmittedCount === safeTotalStudents;

                            let text = "";
                            let color = "";

                            if (a.status === "BERHASIL_PEMBAGIAN_GRUP") {
                              text = t("statusFormed");
                              color = "bg-emerald-50 text-emerald-900";
                            } else if (!a.submittedByMe) {
                              text = t("notFilledBadge");
                              color = "bg-red-50 text-red-900";
                            } else if (a.status === "MENUNGGU" || allStudentsSubmitted) {
                              text = t("statusWaiting");
                              color = "bg-sky-50 text-sky-900";
                            } else {
                              // Student filled but others haven't
                              const totalForMessage =
                                safeTotalStudents > 0 ? safeTotalStudents : clampedSubmittedCount;
                              text = t("statusProgress", {
                                filled: clampedSubmittedCount,
                                total: totalForMessage,
                              });
                              color = "bg-amber-50 text-orange-900";
                            }

                            return (
                              <div className="flex items-center gap-3">
                                <Badge className={`rounded-full ${color} border`}>{text}</Badge>
                                {a.submittedByMe && a.needsUpdate && (
                                  <Badge className="rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                    {t("needsUpdate", {
                                      defaultValue: "Needs Update",
                                    })}
                                  </Badge>
                                )}
                                {process.env.NODE_ENV !== "production" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 rounded-full border border-red-600 text-red-700"
                                    onClick={async (ev) => {
                                      ev.stopPropagation();
                                      try {
                                        if (!confirm(t("resetConfirm"))) return;
                                        const res = await fetch(
                                          `/api/courses/${classId}/assignments/submissions?assignmentId=${a.id}`,
                                          { method: "DELETE" },
                                        );
                                        if (!res.ok) {
                                          console.error("Reset failed", await res.text());
                                          alert(t("resetFailed"));
                                          return;
                                        }
                                        await mutateAssignments();
                                      } catch (err) {
                                        console.error("Reset error", err);
                                        alert(t("resetError"));
                                      }
                                    }}
                                    title="Dev-only reset"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                    {t("reset")}
                                  </Button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <h3 className="mt-2 text-lg font-normal text-stone-900">{a.title}</h3>
                        <div className="mt-1 flex items-center gap-4 text-xs font-normal text-neutral-600">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatIdTimeDate(a.startAt)}
                          </span>
                        </div>
                        {descriptionText ? (
                          <p className="mt-2 font-light text-sm text-neutral-800 whitespace-pre-wrap">
                            {descriptionText}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <EmptyStudentAssignmentState />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
