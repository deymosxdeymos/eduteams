"use client";

import { type ReactNode, useMemo } from "react";
import type { MBTIType } from "@/generated/prisma/client";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  PersonalityAnswerRow,
  SkillAnswerRow,
  TopicAnswerRow,
} from "@/lib/dashboard/assignment-answer-rows";
import { cn } from "@/lib/utils";
import { getFivePointScaleIndex } from "@/lib/utils/five-point-scale";
import { getMBTIColorScheme } from "@/lib/utils/mbti-colors";

const ASSIGNMENT_ANSWER_TAB_VALUES = {
  personality: "personality",
  skills: "skills",
  topics: "topics",
} as const;

type AnswerTableRow = {
  key: string;
  prompt: ReactNode;
  answer: string;
};

type AnswersTranslator = ReturnType<typeof useTranslations<"dashboard.assignment.answersTabs">>;

function renderTranslatedPrompt(
  t: AnswersTranslator,
  key: "skillQuestion" | "topicQuestion",
  values: Record<string, string | number>,
) {
  return t.rich(key, {
    ...values,
    strong: (chunks) => <strong>{chunks}</strong>,
  });
}

const SKILL_LEVEL_KEYS = [
  "skillLevels.beginner",
  "skillLevels.beginnerAdvanced",
  "skillLevels.competent",
  "skillLevels.proficient",
  "skillLevels.expert",
] as const;
const PREFERENCE_LEVEL_KEYS = [
  "preferenceLevels.veryUninterested",
  "preferenceLevels.uninterested",
  "preferenceLevels.neutral",
  "preferenceLevels.interested",
  "preferenceLevels.veryInterested",
] as const;

function toSkillLabel(t: AnswersTranslator, value: number | null | undefined) {
  return t(SKILL_LEVEL_KEYS[getFivePointScaleIndex(value)]);
}

function toPreferenceLabel(t: AnswersTranslator, value: number | null | undefined) {
  return t(PREFERENCE_LEVEL_KEYS[getFivePointScaleIndex(value)]);
}

function toLikertLabel(t: AnswersTranslator, value: number | null | undefined) {
  switch (value) {
    case 1:
      return t("likert.stronglyDisagree");
    case 2:
      return t("likert.disagree");
    case 3:
      return t("likert.neutral");
    case 4:
      return t("likert.agree");
    case 5:
      return t("likert.stronglyAgree");
    default:
      return t("likert.unanswered");
  }
}

interface AnswerTableProps {
  rows: AnswerTableRow[];
  emptyMessage?: string;
  t: AnswersTranslator;
}

function AnswerTable({ rows, emptyMessage, t }: AnswerTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="max-h-[420px] overflow-y-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 w-16">{t("headerNo")}</th>
              <th className="px-4 py-3">{t("headerQuestion")}</th>
              <th className="px-4 py-3">{t("headerAnswer")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, index) => (
              <tr key={row.key} className="hover:bg-gray-50">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{row.prompt}</td>
                <td className="px-4 py-3">{row.answer}</td>
              </tr>
            ))}
            {rows.length === 0 && emptyMessage ? (
              <tr>
                <td className="px-4 py-3" colSpan={3}>
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface AssignmentAnswersTabsProps {
  personalityRows: PersonalityAnswerRow[];
  skills: SkillAnswerRow[];
  topics: TopicAnswerRow[];
  mbtiType: MBTIType | null | undefined;
}

export function AssignmentAnswersTabs({
  personalityRows,
  skills,
  topics,
  mbtiType,
}: AssignmentAnswersTabsProps) {
  const t = useTranslations("dashboard.assignment.answersTabs");
  const colorScheme = getMBTIColorScheme(mbtiType);

  const tabTriggerClassName = cn(
    "group flex-1 border-none bg-transparent flex flex-col items-center gap-1 text-neutral-700 transition-colors hover:bg-transparent hover:text-neutral-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
    colorScheme.activeText,
  );
  const underlineClassName = cn(
    "hidden h-3 w-full rounded-full group-data-[state=active]:block",
    colorScheme.primaryBg,
  );

  const personalityTableRows = useMemo<AnswerTableRow[]>(
    () =>
      personalityRows.map((row) => ({
        key: row.id,
        prompt: row.text,
        answer: toLikertLabel(t, row.answerValue),
      })),
    [personalityRows, t],
  );
  const skillTableRows = useMemo<AnswerTableRow[]>(
    () =>
      skills.map((skill) => ({
        key: skill.name,
        prompt: renderTranslatedPrompt(t, "skillQuestion", { name: skill.name }),
        answer: toSkillLabel(t, skill.level),
      })),
    [skills, t],
  );
  const topicTableRows = useMemo<AnswerTableRow[]>(
    () =>
      topics.map((topic, index) => ({
        key: topic.name,
        prompt: renderTranslatedPrompt(t, "topicQuestion", {
          index: index + 1,
          name: topic.name,
        }),
        answer: toPreferenceLabel(t, topic.preference),
      })),
    [topics, t],
  );

  return (
    <div className="px-2">
      <Tabs defaultValue={ASSIGNMENT_ANSWER_TAB_VALUES.personality} className="w-full">
        <TabsList className="w-full bg-transparent rounded-none p-0 shadow-none text-neutral-700 justify-between">
          <TabsTrigger
            value={ASSIGNMENT_ANSWER_TAB_VALUES.personality}
            className={tabTriggerClassName}
          >
            <span className="group-hover:underline">{t("personality")}</span>
            <span className={underlineClassName} />
          </TabsTrigger>
          <TabsTrigger value={ASSIGNMENT_ANSWER_TAB_VALUES.skills} className={tabTriggerClassName}>
            <span className="group-hover:underline">{t("skills")}</span>
            <span className={underlineClassName} />
          </TabsTrigger>
          <TabsTrigger value={ASSIGNMENT_ANSWER_TAB_VALUES.topics} className={tabTriggerClassName}>
            <span className="group-hover:underline">{t("preferences")}</span>
            <span className={underlineClassName} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value={ASSIGNMENT_ANSWER_TAB_VALUES.personality} className="mt-4">
          <AnswerTable rows={personalityTableRows} t={t} />
        </TabsContent>

        <TabsContent value={ASSIGNMENT_ANSWER_TAB_VALUES.skills} className="mt-4">
          <AnswerTable rows={skillTableRows} emptyMessage={t("emptySkills")} t={t} />
        </TabsContent>

        <TabsContent value={ASSIGNMENT_ANSWER_TAB_VALUES.topics} className="mt-4">
          <AnswerTable rows={topicTableRows} emptyMessage={t("emptyTopics")} t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
