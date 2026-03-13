"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ExtendedUser } from "@/lib/types";
import { TeamMemberCard } from "./team-member-card";

interface TeamMemberDetail extends ExtendedUser {
  topSkills: string[];
  preferredTopics: string[];
}

interface TeamDetailModalContentProps {
  teamId: string;
  groupNumber: number;
  taskName: string;
  className: string;
  qualityScore: number;
  topicName: string;
  members: TeamMemberDetail[];
  onClose?: () => void;
  onPreviousTeam?: () => void;
  onNextTeam?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function TeamDetailModalContent({
  groupNumber,
  taskName,
  className,
  qualityScore,
  topicName,
  members,
  onClose,
  onPreviousTeam,
  onNextTeam,
  hasPrevious = false,
  hasNext = false,
}: TeamDetailModalContentProps) {
  const t = useTranslations("dashboard.teams.teamDetail");
  const pad = (n: number) => n.toString().padStart(2, "0");
  const qualityPct = Math.round(qualityScore * 100);

  return (
    <div className="bg-white rounded-3xl flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {taskName} - {className}
        </h2>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Team Name with Quality and Topic */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-4xl font-semibold text-gray-900 uppercase tracking-tight">
          {t("groupLabel")} {pad(groupNumber)}
        </h1>
        <div className="flex flex-col items-end gap-1">
          <div className="rounded-sm bg-green-50 text-green-900 px-2 py-0.5 text-xs">
            {t("qualityScoreLabel")}: {qualityPct}%
          </div>
          <div className="rounded-sm bg-sky-50 text-sky-900 px-2 py-0.5 text-xs">
            {t("taskTopicLabel")}: {topicName}
          </div>
        </div>
      </div>

      {/* Scrollable Members List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {members.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            topSkills={member.topSkills}
            preferredTopics={member.preferredTopics}
          />
        ))}
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center p-6 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onPreviousTeam}
          disabled={!hasPrevious}
          className="rounded-full h-12 px-10 text-base"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t("previousGroup")}</span>
        </Button>
        <Button
          variant="onboarding"
          onClick={onNextTeam}
          disabled={!hasNext}
          className="rounded-full h-12 px-10 text-base"
        >
          <span>{t("nextGroup")}</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
