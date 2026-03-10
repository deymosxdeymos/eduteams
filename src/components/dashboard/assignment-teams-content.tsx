"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { TeamMemberListClient } from "@/components/dashboard/team-member-list-client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Gender } from "@/generated/prisma/client";
import { EMPTY_SET } from "@/lib/constants";
import type { ExtendedUser } from "@/lib/types";
import { TeamDetailModalContent } from "./team-detail-modal-content";

interface TeamMemberUser {
  id: string;
  name: string | null;
  email?: string | null;
  mbtiType?: string | null;
  nim?: string | null;
  ei?: number | null;
  sn?: number | null;
  tf?: number | null;
  pj?: number | null;
  gender?: Gender | null;
}

interface TeamMemberItem {
  id: string;
  assignedSkillIds?: string[] | null;
  topSkills?: string[];
  preferredTopics?: string[];
  user: TeamMemberUser;
}

interface Team {
  id: string;
  quality?: number | null;
  createdAt: Date;
  members: TeamMemberItem[];
  topicId?: string;
  topicName?: string;
  groupNumber?: number;
}

interface EnrolledStudent {
  id: string;
  name: string | null;
  nim: string | null;
  email: string | null;
  mbtiType: string | null;
  gender: string | null;
}

interface AssignmentTeamsContentProps {
  teams: Team[];
  assignmentId: string;
  courseId: string;
  assignmentTitleLabel: string;
  courseNameLabel: string;
  courseClassLabel: string;
  isStudent?: boolean;
  searchValue?: string;
  hasSearchResults?: boolean;
  canManage?: boolean;
  currentUserId?: string;
  isEditMode?: boolean;
  enrolledStudents?: EnrolledStudent[];
  submittedStudentIds?: Set<string>;
  saveTrigger?: number;
  onMembersCommitted?: (teamId: string, members: TeamMemberItem[]) => void;
  onCourseStudentRemoved?: (studentId: string) => void;
  onPendingAdditionsChange?: (pendingStudentIds: Set<string>) => void;
  onSavingChange?: (isSaving: boolean) => void;
}

const mapMemberToExtendedUser = (member: TeamMemberItem): ExtendedUser => {
  const ei = member.user.ei ?? null;
  const sn = member.user.sn ?? null;
  const tf = member.user.tf ?? null;
  const pj = member.user.pj ?? null;

  return {
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    role: null,
    nim: member.user.nim,
    isOnboarded: true,
    onboardingStep: null,
    mbtiType: (member.user.mbtiType || null) as ExtendedUser["mbtiType"],
    ei,
    sn,
    tf,
    pj,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    image: null,
    emailVerified: false,
    gender: member.user.gender ?? null,
    hasSeenWelcomeSplash: false,
    onboardingData: null,
    personalityData: null,
  } as ExtendedUser;
};

export function AssignmentTeamsContent({
  teams,
  assignmentId,
  assignmentTitleLabel,
  courseNameLabel,
  courseClassLabel,
  courseId,
  isStudent = false,
  searchValue = "",
  hasSearchResults = true,
  canManage = false,
  currentUserId,
  isEditMode = false,
  enrolledStudents = [],
  submittedStudentIds = EMPTY_SET,
  saveTrigger,
  onMembersCommitted,
  onCourseStudentRemoved,
  onPendingAdditionsChange,
  onSavingChange,
}: AssignmentTeamsContentProps) {
  const t = useTranslations("dashboard.teams");
  const pad = (n: number) => n.toString().padStart(2, "0");
  const [activeTeamIndex, setActiveTeamIndex] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const pendingAdditionsByTeamRef = useRef<Map<string, Set<string>>>(new Map());
  const savingByTeamRef = useRef<Map<string, boolean>>(new Map());
  const onPendingAdditionsChangeRef = useRef(onPendingAdditionsChange);
  const onSavingChangeRef = useRef(onSavingChange);

  useEffect(() => {
    onPendingAdditionsChangeRef.current = onPendingAdditionsChange;
  }, [onPendingAdditionsChange]);

  useEffect(() => {
    onSavingChangeRef.current = onSavingChange;
  }, [onSavingChange]);

  const allAssignedStudentIds = useMemo(
    () => new Set(teams.flatMap((team) => team.members.map((m) => m.user.id))),
    [teams],
  );

  const availableStudents = useMemo(
    () => enrolledStudents.filter((s) => !allAssignedStudentIds.has(s.id)),
    [enrolledStudents, allAssignedStudentIds],
  );

  const missingStudentIds = useMemo(
    () => new Set(availableStudents.filter((s) => !submittedStudentIds.has(s.id)).map((s) => s.id)),
    [availableStudents, submittedStudentIds],
  );

  const activeTeam = activeTeamIndex != null ? teams[activeTeamIndex] : null;

  const detailMembers = useMemo(() => {
    if (!activeTeam) {
      return [];
    }

    return activeTeam.members.map((member) => ({
      ...mapMemberToExtendedUser(member),
      topSkills: member.topSkills ?? [],
      preferredTopics: member.preferredTopics ?? [],
    }));
  }, [activeTeam]);

  const classDisplay = useMemo(() => {
    const parts = [courseNameLabel, courseClassLabel].filter(
      (value) => Boolean(value) && value.trim() !== "",
    );
    return parts.length > 0 ? parts.join(" ") : courseNameLabel;
  }, [courseNameLabel, courseClassLabel]);

  const handleOpenTeam = (index: number) => {
    setActiveTeamIndex(index);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setActiveTeamIndex(null);
  };

  const goToPreviousTeam = () => {
    setActiveTeamIndex((prev) => {
      if (prev === null || prev <= 0) {
        return prev;
      }
      return prev - 1;
    });
  };

  const goToNextTeam = () => {
    setActiveTeamIndex((prev) => {
      if (prev === null || prev >= teams.length - 1) {
        return prev;
      }
      return prev + 1;
    });
  };

  const hasPrevious = activeTeamIndex !== null && activeTeamIndex > 0;
  const hasNext = activeTeamIndex !== null && activeTeamIndex < teams.length - 1;
  const activeGroupNumber =
    activeTeam?.groupNumber ?? (activeTeamIndex !== null ? activeTeamIndex + 1 : 1);
  const activeTopicName = activeTeam?.topicName ?? "-";
  const activeQualityScore = activeTeam?.quality ?? 0;

  // Check if current user is a member of the team (for students)
  const isUserInTeam = (team: Team) => {
    if (!isStudent || !currentUserId) return true; // Show for non-students or if no currentUserId
    return team.members.some((member) => member.user.id === currentUserId);
  };

  return (
    <div
      className={
        isStudent ? "flex flex-col gap-4" : "flex flex-col gap-4 pt-4 border-t border-gray-200"
      }
    >
      {!hasSearchResults ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-500 text-sm">{t("noStudentsFound")}</p>
          <p className="text-gray-400 text-xs mt-1">{t("tryDifferentSearch")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team, idx) => {
            const topicName = team.topicName || "-";
            const qualityPct = team.quality != null ? Math.round(team.quality * 100) : null;
            const hasTopic = topicName && topicName !== "-";
            const groupNumber = team.groupNumber ?? idx + 1;
            return (
              <div key={team.id} className="border rounded-xl shadow-sm p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3 min-h-[60px]">
                  <div className="flex flex-col items-start gap-1">
                    <h2 className="font-bold text-2xl text-gray-800 uppercase">
                      {t("group")} {pad(groupNumber)}
                    </h2>
                    {isUserInTeam(team) && (
                      <button
                        type="button"
                        className="flex items-center gap-0.5 p-0 text-sm font-semibold text-blue-500 cursor-pointer hover:underline"
                        onClick={() => handleOpenTeam(idx)}
                      >
                        {t("viewDetails")}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isStudent ? (
                    hasTopic ? (
                      <div className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-xs mt-1">
                        {t("topic")}: {topicName}
                      </div>
                    ) : null
                  ) : (
                    <div className="flex flex-col items-end gap-1 text-sm text-gray-600">
                      <div className="rounded-sm bg-green-50 text-green-900 px-2 py-0.5 text-xs">
                        {t("qualityScore")}: {qualityPct != null ? `${qualityPct}%` : "-"}
                      </div>
                      <div className="rounded-sm bg-sky-50 text-sky-900 px-2 py-0.5 text-xs">
                        {t("topic")}: {hasTopic ? topicName : "-"}
                      </div>
                    </div>
                  )}
                </div>
                <TeamMemberListClient
                  members={team.members.map((m) => ({
                    id: m.id,
                    assignedSkillIds: m.assignedSkillIds,
                    topSkills: m.topSkills ?? [],
                    preferredTopics: m.preferredTopics ?? [],
                    user: {
                      id: m.user.id,
                      name: m.user.name,
                      email: m.user.email,
                      mbtiType: m.user.mbtiType as unknown as string | null,
                      nim: m.user.nim,
                      ei: m.user.ei,
                      sn: m.user.sn,
                      tf: m.user.tf,
                      pj: m.user.pj,
                      gender: m.user.gender,
                    },
                  }))}
                  courseId={courseId}
                  searchValue={searchValue}
                  canManage={canManage}
                  currentUserId={currentUserId}
                  isEditMode={isEditMode}
                  teamId={team.id}
                  assignmentId={assignmentId}
                  availableStudents={availableStudents}
                  missingStudentIds={missingStudentIds}
                  saveTrigger={saveTrigger}
                  onMembersCommitted={(members) => {
                    onMembersCommitted?.(team.id, members);
                  }}
                  onCourseStudentRemoved={onCourseStudentRemoved}
                  onPendingAdditionsChange={(pendingIds) => {
                    const map = pendingAdditionsByTeamRef.current;
                    if (pendingIds.size > 0) {
                      map.set(team.id, new Set(pendingIds));
                    } else {
                      map.delete(team.id);
                    }
                    const combined = new Set<string>();
                    map.forEach((ids) => {
                      ids.forEach((id) => {
                        combined.add(id);
                      });
                    });
                    onPendingAdditionsChangeRef.current?.(combined);
                  }}
                  onSavingChange={(isSaving) => {
                    const map = savingByTeamRef.current;
                    if (isSaving) {
                      map.set(team.id, true);
                    } else {
                      map.delete(team.id);
                    }
                    let anySaving = false;
                    for (const v of map.values()) {
                      if (v) {
                        anySaving = true;
                        break;
                      }
                    }
                    onSavingChangeRef.current?.(anySaving);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setActiveTeamIndex(null);
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="w-[90vw] max-w-[1400px] rounded-3xl p-0 border-0 gap-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            {activeTeam
              ? `${t("detailDialogTitle")} - ${t("group")} ${pad(activeGroupNumber)}`
              : ""}
          </DialogTitle>
          {activeTeam && (
            <TeamDetailModalContent
              teamId={activeTeam.id}
              groupNumber={activeGroupNumber}
              taskName={assignmentTitleLabel}
              className={classDisplay}
              qualityScore={activeQualityScore}
              topicName={activeTopicName}
              members={detailMembers}
              onClose={handleCloseDetail}
              onPreviousTeam={goToPreviousTeam}
              onNextTeam={goToNextTeam}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
