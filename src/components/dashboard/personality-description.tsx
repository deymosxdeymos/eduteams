"use client";

import { useTranslations } from "next-intl";
import type { ExtendedUser } from "@/lib/types";
import { getMBTIColorScheme } from "@/lib/utils/mbti-colors";
import { getMBTIType } from "@/lib/utils/mbti-helpers";

interface PersonalityDescriptionProps {
  user: ExtendedUser;
}

export function PersonalityDescription({ user }: PersonalityDescriptionProps) {
  const t = useTranslations("dashboard.personality");
  const mbtiType = getMBTIType(user);
  const colorScheme = getMBTIColorScheme(mbtiType);

  if (!mbtiType) {
    return (
      <div
        className={`flex flex-col text-start border ${colorScheme.lightBorder} rounded-xl shadow-glow ${colorScheme.lightShadow} p-4 gap-4 flex-1 self-stretch`}
      >
        <h1 className={`text-3xl font-bold ${colorScheme.primaryText}`}>
          {t("completeTestTitle")}
        </h1>
        <p className="text-xs text-black font-normal text-justify">
          {t("completeTestDescription")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col text-start border ${colorScheme.lightBorder} rounded-xl shadow-glow ${colorScheme.lightShadow} p-4 gap-4 flex-1 self-stretch`}
    >
      <h1 className={`text-3xl font-bold ${colorScheme.primaryText}`}>{t(`${mbtiType}.title`)}</h1>
      <p className="text-xs text-black font-normal text-justify whitespace-pre-line">
        {t(`${mbtiType}.description`)}
      </p>
    </div>
  );
}
