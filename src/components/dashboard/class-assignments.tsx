"use client";

import { ArrowLeft, Calendar, Plus, Share2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import { fetcher } from "@/lib/client-api";
import { dateFormatterUTC, timeFormatterUTC } from "@/lib/constants";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import type { AssignmentResponse } from "@/lib/validation/assignments";
import { EmptyAssignmentState } from "./empty-assignment-state";
import { SearchInput } from "./search-input";

const ShareClassModal = dynamic(
  () =>
    import("./share-class-modal").then((mod) => ({
      default: mod.ShareClassModal,
    })),
  { ssr: false },
);
const CreateAssignmentModal = dynamic(
  () =>
    import("./create-assignment-modal").then((mod) => ({
      default: mod.CreateAssignmentModal,
    })),
  { ssr: false },
);

interface ClassAssignmentsProps {
  classId: string;
  courseData: {
    id: string;
    namaMataKuliah: string;
    kelas: string;
    shareToken?: string | null;
  };
  initialAssignments?: AssignmentResponse[];
  studentCount?: number;
}

export function ClassAssignments({
  classId,
  courseData,
  initialAssignments,
  studentCount = 0,
}: ClassAssignmentsProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.classAssignments");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useQueryState("search", {
    defaultValue: "",
    shallow: true,
  });
  const hasInitialAssignments = initialAssignments !== undefined;
  const { data: assignmentsData, mutate: mutateAssignments } = useSWR(
    `/api/courses/${classId}/assignments`,
    fetcher<{ data: AssignmentResponse[] }>,
    {
      fallbackData: initialAssignments ? { data: initialAssignments } : undefined,
      revalidateOnMount: !hasInitialAssignments,
      revalidateIfStale: !hasInitialAssignments,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const assignments: AssignmentResponse[] = assignmentsData?.data ?? [];
  const hasAssignments = assignments.length > 0;

  const filteredAssignments = useFuzzySearch<AssignmentResponse>({
    data: assignments,
    searchTerm,
    keys: ["title"],
    debounceDelay: 250,
  });

  const formatIdTimeDate = (input: Date | string) => {
    const d = new Date(input);
    return `${timeFormatterUTC.format(d)}, ${dateFormatterUTC.format(d)}`;
  };

  const extractDescriptionText = (description: string | null | undefined) => {
    if (!description) return null;
    try {
      const parsed = JSON.parse(description);
      return parsed.text || null;
    } catch {
      return description;
    }
  };

  return (
    <div className="bg-white rounded-3xl rounded-r-none h-full flex flex-col overflow-hidden">
      <div className="p-6 pb-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/dashboard" prefetch>
              <ArrowLeft strokeWidth={2} className="w-5 h-5 text-gray-600" />
            </Link>
          </Button>

          <Button
            variant="onboarding"
            className="rounded-full p-6"
            onClick={() => {
              setIsCreateAssignmentModalOpen(true);
            }}
          >
            <Plus strokeWidth={3} className="w-4 h-4 text-white" />
            <span className="font-semibold text-sm">{t("createAssignment")}</span>
          </Button>

          <Button
            variant="outline"
            className="rounded-full p-6"
            onClick={() => setIsShareModalOpen(true)}
          >
            <Share2 className="w-4 h-4" />
            <span className="font-semibold text-sm">{t("shareClass")}</span>
          </Button>

          {hasAssignments && (
            <SearchInput
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder={t("searchPlaceholder")}
              ariaLabel={t("searchAria")}
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
                    {t("noMatches", { query: searchTerm })}
                  </div>
                ) : null}
                {filteredAssignments.map((a) => {
                  const descriptionText = extractDescriptionText(a.description);
                  return (
                    <div key={a.id} className="content-auto">
                      <div
                        className="border rounded-2xl p-4 bg-card cursor-pointer hover:shadow-sm active:opacity-95"
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          router.push(`/dashboard/class/${classId}/assignments/${a.id}`)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(`/dashboard/class/${classId}/assignments/${a.id}`);
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
                              text = t("status.formed");
                              color = "bg-emerald-50 text-emerald-900";
                            } else if (a.status === "MENUNGGU" || allStudentsSubmitted) {
                              text = t("status.waiting");
                              color = "bg-sky-50 text-sky-900";
                            } else if (safeSubmittedCount === 0) {
                              text = t("status.noneFilled");
                              color = "bg-red-50 text-red-900";
                            } else {
                              const totalForMessage =
                                safeTotalStudents > 0 ? safeTotalStudents : clampedSubmittedCount;
                              text = t("status.progress", {
                                filled: clampedSubmittedCount,
                                total: totalForMessage,
                              });
                              color = "bg-amber-50 text-orange-900";
                            }

                            return <Badge className={`rounded-full ${color} border`}>{text}</Badge>;
                          })()}
                        </div>
                        <h3 className="mt-2 text-lg font-normal text-stone-900">{a.title}</h3>
                        <div className="mt-1 flex items-center gap-4 text-xs font-normal  text-neutral-600">
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
              <EmptyAssignmentState />
            </div>
          )}
        </div>
      </div>

      {isShareModalOpen ? (
        <ShareClassModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          courseData={courseData}
        />
      ) : null}

      {isCreateAssignmentModalOpen ? (
        <CreateAssignmentModal
          open={isCreateAssignmentModalOpen}
          onOpenChange={setIsCreateAssignmentModalOpen}
          classId={classId}
          onCreatedAction={(newAssignment) => {
            if (newAssignment) {
              void mutateAssignments(
                (current) => ({
                  data: [newAssignment, ...(current?.data ?? [])],
                }),
                { revalidate: true },
              );
            } else {
              void mutateAssignments();
            }
          }}
        />
      ) : null}
    </div>
  );
}
