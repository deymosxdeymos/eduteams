"use client";

import { ArrowLeft, Sparkle, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SidebarData } from "@/lib/dashboard/sidebar-data";
import type { ExtendedUser } from "@/lib/types";
import { getMBTIColorScheme } from "@/lib/utils/mbti-colors";
import { getMBTIType } from "@/lib/utils/mbti-helpers";
import type { MBTIType } from "@/lib/validation/personality";
import Nav from "./nav";
import Sidebar from "./sidebar";

interface MBTIOverviewLayoutProps {
  user: ExtendedUser;
  isModal?: boolean;
  isCompact?: boolean;
  onRequestClose?: () => void;
  sidebarData?: SidebarData;
}

export function MBTIOverviewLayout({
  user,
  isModal = false,
  isCompact = false,
  onRequestClose,
  sidebarData,
}: MBTIOverviewLayoutProps) {
  const t = useTranslations("dashboard.personality");
  const tProfile = useTranslations("dashboard.profile");
  const mbtiType = getMBTIType(user);
  const initialSelected = useMemo<MBTIType | null>(() => mbtiType ?? null, [mbtiType]);
  const [selectedMBTI, setSelectedMBTI] = useState<MBTIType | null>(initialSelected);

  const handleMBTIClick = (mbtiType: MBTIType) => {
    setSelectedMBTI(selectedMBTI === mbtiType ? null : mbtiType);
  };

  const handleKeyDown = (event: React.KeyboardEvent, mbtiType: MBTIType) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleMBTIClick(mbtiType);
    }
  };

  return (
    <main
      className={`${isModal ? "" : "bg-accent px-10 py-8 h-screen"} flex flex-col overflow-hidden`}
    >
      {!isModal && (
        <div className="mb-8">
          <Nav user={user} />
        </div>
      )}
      <div className={`${isModal ? "" : "grid grid-cols-[auto_1fr] flex-1 min-h-0"}`}>
        {!isModal && sidebarData?.user && (
          <Sidebar user={sidebarData.user} notStartedCount={sidebarData.notStartedCount} />
        )}
        <div className={`${isModal ? "" : "px-8 pb-0 min-h-0"}`}>
          <div
            className={`bg-white rounded-3xl ${isModal ? "h-full" : "h-full"} flex flex-col overflow-hidden ${isCompact ? "p-6 gap-1" : "p-4 gap-2"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!isModal && onRequestClose && (
                  <button
                    onClick={onRequestClose}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    aria-label={tProfile("back")}
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                <p className="text-xl text-stone-900 font-semibold">{t("overviewTitle")}</p>
              </div>
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  setSelectedMBTI(mbtiType ?? null);
                  onRequestClose?.();
                }}
                aria-label={tProfile("close")}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            <div className={`flex ${isCompact ? "gap-x-2" : "gap-x-4"} h-full`}>
              {/* mbti list stuff */}
              <div className={`flex flex-col gap-y-6 shrink-0`}>
                {/* purple */}
                <div className={`flex gap-x-3`}>
                  <div
                    onClick={() => handleMBTIClick("INTJ")}
                    onKeyDown={(e) => handleKeyDown(e, "INTJ")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "INTJ"}
                    className={`bg-violet-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-violet-600 ${
                      selectedMBTI === "INTJ"
                        ? "border-3 border-violet-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-violet-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      INTJ
                    </p>
                    <Image
                      src="/mbti-list/INTJ.svg"
                      alt="INTJ"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("INTP")}
                    onKeyDown={(e) => handleKeyDown(e, "INTP")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "INTP"}
                    className={`bg-violet-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-violet-600 ${
                      selectedMBTI === "INTP"
                        ? "border-3 border-violet-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-violet-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      INTP
                    </p>
                    <Image
                      src="/mbti-list/INTP.svg"
                      alt="INTP"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("ENTJ")}
                    onKeyDown={(e) => handleKeyDown(e, "ENTJ")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ENTJ"}
                    className={`bg-violet-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-violet-600 ${
                      selectedMBTI === "ENTJ"
                        ? "border-3 border-violet-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-violet-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ENTJ
                    </p>
                    <Image
                      src="/mbti-list/ENTJ.svg"
                      alt="ENTJ"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("ENTP")}
                    onKeyDown={(e) => handleKeyDown(e, "ENTP")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ENTP"}
                    className={`bg-violet-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-violet-600 ${
                      selectedMBTI === "ENTP"
                        ? "border-3 border-violet-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-violet-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ENTP
                    </p>
                    <Image
                      src="/mbti-list/ENTP.svg"
                      alt="ENTP"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                </div>
                {/* green */}
                <div className={`flex ${isCompact ? "gap-x-2" : "gap-x-3"}`}>
                  <div
                    onClick={() => handleMBTIClick("INFJ")}
                    onKeyDown={(e) => handleKeyDown(e, "INFJ")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "INFJ"}
                    className={`bg-green-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-green-600 ${
                      selectedMBTI === "INFJ"
                        ? "border-3 border-emerald-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-green-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      INFJ
                    </p>
                    <Image
                      src="/mbti-list/INFJ.svg"
                      alt="INFJ"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("INFP")}
                    onKeyDown={(e) => handleKeyDown(e, "INFP")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "INFP"}
                    className={`bg-green-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-green-600 ${
                      selectedMBTI === "INFP"
                        ? "border-3 border-emerald-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-green-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      INFP
                    </p>
                    <Image
                      src="/mbti-list/INFP.svg"
                      alt="INFP"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("ENFJ")}
                    onKeyDown={(e) => handleKeyDown(e, "ENFJ")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ENFJ"}
                    className={`bg-green-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-green-600 ${
                      selectedMBTI === "ENFJ"
                        ? "border-3 border-emerald-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-green-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ENFJ
                    </p>
                    <Image
                      src="/mbti-list/ENFJ.svg"
                      alt="ENFJ"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("ENFP")}
                    onKeyDown={(e) => handleKeyDown(e, "ENFP")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ENFP"}
                    className={`bg-green-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-green-600 ${
                      selectedMBTI === "ENFP"
                        ? "border-3 border-emerald-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-green-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ENFP
                    </p>
                    <Image
                      src="/mbti-list/ENFP.svg"
                      alt="ENFP"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                </div>
                {/* blue */}
                <div className={`flex ${isCompact ? "gap-x-2" : "gap-x-3"}`}>
                  <div
                    onClick={() => handleMBTIClick("ISTJ")}
                    onKeyDown={(e) => handleKeyDown(e, "ISTJ")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ISTJ"}
                    className={`bg-blue-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-blue-600 ${
                      selectedMBTI === "ISTJ"
                        ? "border-3 border-sky-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-blue-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ISTJ
                    </p>
                    <Image
                      src="/mbti-list/ISTJ.svg"
                      alt="ISTJ"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("ISFJ")}
                    onKeyDown={(e) => handleKeyDown(e, "ISFJ")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ISFJ"}
                    className={`bg-blue-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-blue-600 ${
                      selectedMBTI === "ISFJ"
                        ? "border-3 border-sky-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-blue-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ISFJ
                    </p>
                    <Image
                      src="/mbti-list/ISFJ.svg"
                      alt="ISFJ"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("ESTJ")}
                    onKeyDown={(e) => handleKeyDown(e, "ESTJ")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ESTJ"}
                    className={`bg-blue-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-blue-600 ${
                      selectedMBTI === "ESTJ"
                        ? "border-3 border-sky-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-blue-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ESTJ
                    </p>
                    <Image
                      src="/mbti-list/ESTJ.svg"
                      alt="ESTJ"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("ESFJ")}
                    onKeyDown={(e) => handleKeyDown(e, "ESFJ")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ESFJ"}
                    className={`bg-blue-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-blue-600 ${
                      selectedMBTI === "ESFJ"
                        ? "border-3 border-sky-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-blue-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ESFJ
                    </p>
                    <Image
                      src="/mbti-list/ESFJ.svg"
                      alt="ESFJ"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                </div>
                {/* amber */}
                <div className="flex gap-x-2">
                  <div
                    onClick={() => handleMBTIClick("ISTP")}
                    onKeyDown={(e) => handleKeyDown(e, "ISTP")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ISTP"}
                    className={`bg-orange-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-orange-600 ${
                      selectedMBTI === "ISTP"
                        ? "border-3 border-amber-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-orange-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ISTP
                    </p>
                    <Image
                      src="/mbti-list/ISTP.svg"
                      alt="ISTP"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("ISFP")}
                    onKeyDown={(e) => handleKeyDown(e, "ISFP")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ISFP"}
                    className={`bg-orange-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-orange-600 ${
                      selectedMBTI === "ISFP"
                        ? "border-3 border-amber-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-orange-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ISFP
                    </p>
                    <Image
                      src="/mbti-list/ISFP.svg"
                      alt="ISFP"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("ESTP")}
                    onKeyDown={(e) => handleKeyDown(e, "ESTP")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ESTP"}
                    className={`bg-orange-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-orange-600 ${
                      selectedMBTI === "ESTP"
                        ? "border-3 border-amber-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-orange-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ESTP
                    </p>
                    <Image
                      src="/mbti-list/ESTP.svg"
                      alt="ESTP"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick("ESFP")}
                    onKeyDown={(e) => handleKeyDown(e, "ESFP")}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMBTI === "ESFP"}
                    className={`bg-orange-100 ${isCompact ? "pt-2 pl-2" : "pt-3 pl-2"} rounded-xl text-start relative overflow-hidden ${isCompact ? "w-28 h-28" : "w-30 h-30"} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-orange-600 ${
                      selectedMBTI === "ESFP"
                        ? "border-3 border-amber-600"
                        : "border-3 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-orange-600 ${isCompact ? "text-2xl" : "text-3xl"} font-bold z-10 relative`}
                    >
                      ESFP
                    </p>
                    <Image
                      src="/mbti-list/ESFP.svg"
                      alt="ESFP"
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className="absolute -right-1 -bottom-1 z-0"
                    />
                  </div>
                </div>
              </div>
              {/* mbti display area */}
              <div className="flex flex-col gap-4 flex-1 h-full overflow-y-auto">
                {selectedMBTI ? (
                  <>
                    <div
                      className={`flex items-center justify-center border ${getMBTIColorScheme(selectedMBTI).lightBorder} rounded-xl shadow-glow ${getMBTIColorScheme(selectedMBTI).lightShadow} px-4 py-3 w-full h-20`}
                    >
                      <Sparkle
                        className={`${getMBTIColorScheme(selectedMBTI).primaryText} rounded-md w-16 h-10 py-[1px] shrink-0`}
                        size={14}
                        fill="currentColor"
                      />
                      <div className="flex items-center justify-center">
                        <Image
                          src={`/mbti-text/${selectedMBTI}.svg`}
                          alt={selectedMBTI}
                          width={140}
                          height={45}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <Sparkle
                        className={`${getMBTIColorScheme(selectedMBTI).primaryText} rounded-md w-16 h-10 py-[1px] shrink-0`}
                        size={14}
                        fill="currentColor"
                      />
                    </div>
                    <div className="flex justify-center w-full h-48">
                      <div className="flex items-center justify-center w-48 h-48">
                        <Image
                          src={`/mbti-type/${selectedMBTI}.svg`}
                          alt={selectedMBTI}
                          width={200}
                          height={200}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0">
                      <div
                        className={`flex flex-col text-start border ${getMBTIColorScheme(selectedMBTI).lightBorder} rounded-xl shadow-glow ${getMBTIColorScheme(selectedMBTI).lightShadow} p-4 gap-4 flex-1 self-stretch`}
                      >
                        <h1
                          className={`text-3xl font-bold ${getMBTIColorScheme(selectedMBTI).primaryText}`}
                        >
                          {t(`${selectedMBTI}.title`)}
                        </h1>
                        <p className="text-sm text-black font-normal text-justify whitespace-pre-line">
                          {t(`${selectedMBTI}.description`)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  // Auto-select user's MBTI when available; fallback shows nothing extra
                  <div className="flex-1" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
